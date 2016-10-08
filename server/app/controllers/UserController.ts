import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import bcrypt = require('bcrypt');
import fs = require('fs');
import path = require('path');
import * as Joi from "joi";
import {ValidationError} from "joi";
import {Config} from "../../config/Config";
import {User, UserProvider, Validation, UserRoles} from "../models/User";
import {arangoClient, redisClient, arangoCollections} from "../../config/Database";
import {DecodedToken, UserDataCache, TokenData} from "../models/Token";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import {Cursor} from "arangojs";
import {Edge} from "../models/Edge";
import sharp = require("sharp");

export module UserController {
	
	interface UserRecipe {
		username: string;
		mail: string;
		password?: string;
		firstName?: string;
		lastName?: string;
	}
	
	export function createUser(recipe: UserRecipe): Promise<User> {
		// Validate inputs.
		let promise = new Promise((resolve, reject) => {
			Joi.validate(recipe, {
				username: Validation.username,
				password: recipe.password === undefined ? Validation.password.optional() : Validation.password,
				mail: Validation.mail,
				firstName: Validation.firstName,
				lastName: Validation.lastName,
			}, (err: ValidationError, validatedRecipe: UserRecipe) => {
				if (err) {
					reject(Boom.badRequest(err.message));
					return;
				}
				resolve(validatedRecipe);
			});
		});
		
		// Does user already exist?
		promise = promise.then((validatedRecipe: UserRecipe) => {
			return Promise.all([
				findByUsername(recipe.username).catch(() => null),
				findByMail(recipe.mail).catch(() => null)
			]).then((values: User[]) => {
				return new Promise<UserRecipe>((resolve, reject) => {
					if(values[0] || values[1]) {
						reject(Boom.badRequest('Cannot create user as the username or mail is already in use.'));
						return;
					}
					resolve(validatedRecipe);
				});
			});
		});
		
		// Create user.
		promise = promise.then((validatedRecipe: UserRecipe) => {
			return {
				firstName: validatedRecipe.firstName ? validatedRecipe.firstName : null,
				lastName: validatedRecipe.lastName ? validatedRecipe.lastName : null,
				username: validatedRecipe.username,
				mails: [{mail: validatedRecipe.mail, verified: false}],
				scope: [UserRoles.user],
				location: null,
				meta: {},
				auth: {
					password: null,
					providers: []
				}
			};
		}).then((user: User) => setPassword(user, recipe.password));
		
		return promise;
	}
	
	interface CheckUsernameResult {
		username: string;
		available: boolean;
		recommendations?: Array<string>
	}
	
	export function checkUsername(username: string): Promise<CheckUsernameResult> {
		//TODO The recommendation array does return strings greater than 16 chars.
		// Check validity.
		if (!Joi.validate(username, Validation.username)) return Promise.reject<CheckUsernameResult>(Boom.badRequest('Username has an invalid length or unexpected characters.'));
		
		let aqlQuery = `FOR u in @@collection FILTER REGEX_TEST(u.username, "^${username}[0-9]*$") RETURN u`;//TODO Bind Parameter?
		let aqlParams = {
			'@collection': arangoCollections.users
		};
		return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.map((user: User) => user.username)).then((takenUsernames: Array<string>) => {
			let usernameCheckResult: any = {
				username: username,
				available: takenUsernames.length == 0 || takenUsernames.indexOf(username) < 0
			};
			
			if (!usernameCheckResult.available) {
				// Add recommendations.
				usernameCheckResult.recommendations = [];
				
				let pad = (num: number) => {
					let padNum: string = num.toString();
					while (padNum.length < 2) padNum = "0" + padNum;
					return padNum;
				};
				
				/*
				 Method 1 - Append a number.
				 Method 2 - Append a number with pad.
				 */
				let methods = [
					`${username}#`,
					`${username}##`
				];
				methods.forEach(method => {
					let counter: number = 2;
					while (true) {
						let suggestion = method.replace('##', pad(counter)).replace('#', counter.toString());
						if (takenUsernames.indexOf(suggestion) < 0) {
							usernameCheckResult.recommendations.push(suggestion);
							break;
						}
						counter++;
					}
				});
			}
			
			return usernameCheckResult;
		});
	}
	
	export function setPassword(user: User, password?: string): Promise<User> {
		return new Promise<User>((resolve, reject) => {
			bcrypt.hash(password ? password : randomstring.generate(10), 10, (err, hash) => {
				if (err) {
					reject(err);
					return;
				}
				user.auth.password = hash;
				resolve(user);
			});
		});
	}
	
	function getUserDataCache(userId: number | string): Promise<UserDataCache> {
		return new Promise<UserDataCache>((resolve, reject) => {
			// Retrieve user in redis.
			let redisKey: string = `user-${userId}`;
			redisClient.get(redisKey, (err, reply) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(reply ? JSON.parse(reply) : {
					userId: userId,
					tokens: []
				});
			});
		});
	}
	
	function saveUserDataCache(userDataCache: UserDataCache): Promise<UserDataCache> {
		return new Promise<UserDataCache>((resolve, reject) => {
			// Retrieve user in redis.
			let redisKey: string = `user-${userDataCache.userId}`;
			redisClient.set(redisKey, JSON.stringify(userDataCache), err => {
				if (err) {
					reject(err);
					return;
				}
				resolve(userDataCache);
			});
		});
	}
	
	export function getTokenData(token: DecodedToken, includeExpiredTokens: boolean = false): Promise<TokenData> {
		return getUserDataCache(token.userId).then((userDataCache: UserDataCache) => {
			// Search token.
			let foundTokenData: TokenData;
			userDataCache.tokens = userDataCache.tokens.filter((tokenItem: TokenData) => {
				// Delete old expired token.
				let now: number = Date.now();
				if (tokenItem.expiresAt <= now + Config.jwt.deleteIn) return false;
				
				// Extend expiry of an successfully discovered token that is still within the expiry range.
				if (tokenItem.tokenId === token.tokenId) {
					if (tokenItem.expiresAt > now) tokenItem.expiresAt = now + Config.jwt.expiresIn;
					if (includeExpiredTokens || tokenItem.expiresAt > now) foundTokenData = tokenItem;
				}
				
				// Keep token.
				return true;
			});
			
			// Save changes.
			return saveUserDataCache(userDataCache).then((userDataCache: UserDataCache) => {
				return new Promise<TokenData>((resolve, reject) => {
					if (foundTokenData) {
						resolve(foundTokenData);
						return;
					}
					reject(Boom.badRequest('Token is invalid!'));
				});
			});
		});
	}
	
	export function signToken(user: User): Promise<String> {
		// Define token.
		let token: DecodedToken = {
			tokenId: Uuid.v4(),
			userId: user._key
		};
		
		return getUserDataCache(user._key).then((userDataCache: UserDataCache) => {
			let now = Date.now();
			
			// Add token.
			userDataCache.tokens.push({
				tokenId: token.tokenId,
				deviceName: 'Device', // TODO
				createdAt: now,
				expiresAt: now + Config.jwt.expiresIn
			});
			return userDataCache;
		}).then(saveUserDataCache).then(() => {
			return new Promise<String>((resolve, reject) => {
				// Sign web token.
				jwt.sign(token, Config.jwt.salt, {
					algorithm: 'HS256'
				}, (err, token: string) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(token);
				});
			});
		});
	}
	
	export function unsignToken(token: DecodedToken): Promise<UserDataCache> {
		return getUserDataCache(token.userId).then((userDataCache: UserDataCache) => {
			return new Promise<UserDataCache>((resolve, reject) => {
				for (let i = 0; i < userDataCache.tokens.length; i++) {
					let tokenItem = userDataCache.tokens[i];
					if (tokenItem.tokenId != token.tokenId) continue;
					
					tokenItem.expiresAt = Date.now(); // Expire.
					resolve(userDataCache);
					return;
				}
				
				reject(Boom.badRequest('Token is invalid.'));
			});
		}).then(saveUserDataCache);
	}
	
	export function checkPassword(user: User, password: string): Promise<User> {
		return new Promise<User>((resolve, reject) => {
			bcrypt.compare(password, user.auth.password, (err, isMatch) => {
				// Match?
				if (err || !isMatch) {
					reject(Boom.badRequest('Combination of username and password does not match.'));
					return;
				}
				
				// Matched!
				resolve(user);
			});
		});
	}
	
	export function findByProvider(provider: UserProvider): Promise<User> {
		let aqlQuery = `FOR u IN @@collection FOR p IN u.auth.providers FILTER p.provider == @provider && p.userIdentifier == @userIdentifier RETURN u`;
		let aqlParams = {
			'@collection': arangoCollections.users,
			provider: provider.provider,
			userIdentifier: provider.userIdentifier
		};
		return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()).then((user: User) => {
			return new Promise<User>((resolve, reject) => {
				// No user found?
				if (user === undefined) {
					reject(Boom.notFound('User not found.'));
					return;
				}
				resolve(user);
			});
		});
	}
	
	export function findByUsername(username: string): Promise<User> {
		let aqlQuery = `FOR u IN @@collection FILTER u.username == @username LIMIT 1 RETURN u`;
		let aqlParams = {
			'@collection': arangoCollections.users,
			username: username
		};
		return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()).then((user: User) => {
			return new Promise<User>((resolve, reject) => {
				// No user found?
				if (user === undefined) {
					reject(Boom.notFound('User not found.'));
					return;
				}
				resolve(user);
			});
		});
	}
	
	export function findByMail(mail: string): Promise<User> {
		let aqlQuery = `FOR u IN @@collection FOR m IN u.mail FILTER m.mail == @mail && m.verified == true LIMIT 1 RETURN u`;
		let aqlParams = {
			'@collection': arangoCollections.users,
			mail: mail
		};
		return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => {
			return cursor.next();
		}).then((user: User) => {
			return new Promise<User>((resolve, reject) => {
				// No user found?
				if (user === undefined) {
					reject(Boom.notFound('User not found.'));
					return;
				}
				resolve(user);
			});
		});
	}
	
	export function findByToken(token: DecodedToken): Promise<User> {
		return getTokenData(token).then(() => {
			// Search for user.
			let aqlQuery = `FOR u IN @@collection FILTER u._key == @key LIMIT 1 RETURN u`;
			let aqlParams = {
				'@collection': arangoCollections.users,
				key: token.userId
			};
			return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()).then((user: User) => {
				return new Promise<User>((resolve, reject) => {
					// No user found?
					if (user === undefined) {
						reject(Boom.notFound('User not found.'));
						return;
					}
					resolve(user);
				});
			});
		});
	}
	
	export function addProvider(user: User, provider: UserProvider, save: boolean = false): Promise<User> {
		return new Promise<User>(resolve => {
			let existingProviderIndex: number = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
			if (existingProviderIndex >= 0)
				user.auth.providers[existingProviderIndex] = provider;
			else
				user.auth.providers.push(provider);
			return resolve(save ? saveUser(user) : user);
		});
	}
	
	export function removeProvider(user: User, provider: UserProvider, save: boolean = false): Promise<User> {
		return new Promise<User>(resolve => {
			let existingProviderIndex: number = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
			if (existingProviderIndex >= 0) user.auth.providers.splice(existingProviderIndex, 1);
			return resolve(save ? saveUser(user) : user);
		});
	}
	
	export function saveUser(user: User): Promise<User> {
		// Set new timestamps.
		let now = Date.now();
		user.updatedAt = now;
		if (!user._key) user.createdAt = now;
		
		let aqlQuery = user._key ?
			`REPLACE @document IN @@collection RETURN NEW` :
			`INSERT @document INTO @@collection RETURN NEW`;
		let aqlParams = {
			'@collection': arangoCollections.users,
			document: user
		};
		
		return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next());
	}
	
	export function getPublicProfile(user: User | User[], url: string): Promise<any> {
		let transform = user => {
			// Add default links.
			let links = {
				followers: `${url}/api/users/${user.username}/followers`,
				followees: `${url}/api/users/${user.username}/following`
			};
			
			// Add avatar links?
			if(user.hasAvatars) {
				links['avatars'] = {
					small: `${url}/static/avatars/${user._key}-small`,
					medium: `${url}/static/avatars/${user._key}-medium`,
					large: `${url}/static/avatars/${user._key}-large`
				};
			}
			
			// Build profile.
			return dot.transform({
				'user._key': 'id',
				'user.username': 'username',
				'user.firstName': 'firstName',
				'user.lastName': 'lastName',
				'user.createdAt': 'createdAt',
				'links': 'links'
			}, {
				user: user,
				links: links
			});
		};
		
		let transformed = user instanceof Array ? user.map(transform) : transform(user);
		return Promise.resolve(transformed);
	}
	
	export function getPeopleSuggestions(user: User): Promise<User[]> {
		let aqlQuery = `LET followees = (FOR e IN @@edges FILTER e._from == @user RETURN e._to) FOR u IN @@collection FILTER u._id != @user FILTER u._id NOT IN followees LIMIT 5 RETURN u`;
		let aqlParams = {
			'@edges': arangoCollections.userConnections,
			'@collection': arangoCollections.users,
			user: user._id
		};
		return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all());
	}
	
	export function getUserConnections(from: User, to: User) : Promise<User[]> {
		if(!from && !to) throw('Invalid arguments: At least one argument has to be an user.');
		let aqlQuery = from && to ?
			`FOR u IN OUTBOUND @from @@edges FILTER u._id == @to RETURN u` :
			`FOR u IN ${from ? 'OUTBOUND' : 'INBOUND'} @from @@edges RETURN u`;
		let aqlParam = {
			'@edges': arangoCollections.userConnections
		};
		if(to) aqlParam['to'] = to._id;
		if(from) aqlParam['from'] = from._id;
		return arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => cursor.all());
	}
	
	export function addUserConnection(user: User, aimedUser: User) : Promise<Edge> {
		if(aimedUser._id === user._id) return Promise.reject<Edge>(Boom.badRequest('Users cannot follow themselves.'));
		
		let now = Date.now();
		let edge : Edge = {
			_from: user._id,
			_to: aimedUser._id,
			createdAt: now,
			updatedAt: now
		};
	
		let aqlQuery = `INSERT @document INTO @@edges RETURN NEW`;
		let aqlParams = {
			'@edges': arangoCollections.userConnections,
			document: edge
		};
		return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next());
	}
	
	export function removeUserConnection(user: User, aimedUser: User): Promise<void> {
		let aqlQuery = `FOR e IN @@edges FILTER e._from == @from && e._to == @to REMOVE e IN @@edges`;
		let aqlParams = {
			'@edges': arangoCollections.userConnections,
			from: user._id,
			to: aimedUser._id
		};
		return arangoClient.query(aqlQuery, aqlParams).then(() => {});
	}
	
	export function getMutualFollowers(users: User[]): Promise<User[]> {
		if(!users || users.length < 2) throw('Invalid arguments: At least choose two users for mutual comparison.');
		let friendsOfUser = users.map((user: User, index: number) => `(FOR v IN ANY @user_${index} @@edges RETURN v._id)`).join(',');
		let aqlQuery = `FOR u IN INTERSECTION (${friendsOfUser}) RETURN u`;
		let aqlParam = {
			'@edges': arangoCollections.userConnections
		};
		users.forEach((user: User, index: number) => {
			aqlParam[`user_${index}`] = user._id;
		});
		return arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => cursor.all());
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [POST] /api/me/avatar
		 * @param request Request-Object
		 * @param request.payload.file uploaded avatar file
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function uploadAvatar(request: any, reply: any): void {
			let user = request.auth.credentials;
			let promise = new Promise((resolve, reject) => {
				if (request.payload.file) {
					let uploadDir = path.resolve(__dirname, '../../', 'uploads/avatars/', user._key);
					let small = fs.createWriteStream(`${uploadDir}-small`);
					let medium = fs.createWriteStream(`${uploadDir}-medium`);
					let large = fs.createWriteStream(`${uploadDir}-large`);
					
					let transformations = sharp();
					transformations.clone().resize(100, 100).max().crop(sharp.strategy.entropy).toFormat('png').pipe(small).on('error', reject);
					transformations.clone().resize(450, 450).max().crop(sharp.strategy.entropy).toFormat('png').pipe(medium).on('error', reject);
					transformations.clone().resize(800, 800).max().crop(sharp.strategy.entropy).toFormat('png').pipe(large).on('error', reject);
					
					request.payload.file.pipe(transformations);
					request.payload.file.on('end', () => {
						user.hasAvatar = true;
						resolve(saveUser(user));
					});
					return;
				}
				
				reject(Boom.badData('Missing file payload.'));
			}).catch(err => {
				request.log(err);
				return Promise.reject(Boom.badImplementation('An server error occurred! Please try again.'))
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/me/suggestions/people
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param reply Reply-Object
		 */
		export function getPeopleSuggestions(request: any, reply: any): void {
			let promise = UserController.getPeopleSuggestions(request.auth.credentials).then((users: User[]) => getPublicProfile(users, request.connection.info.uri));
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/users/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param reply Reply-Object
		 */
		export function getUserOf(request: any, reply: any): void {
			let username = encodeURIComponent(request.params.username);
			let promise = findByUsername(username).then((user: User) => {
				return getPublicProfile(user, request.connection.info.uri).then((profile: any) => {
					return Promise.all([
						getUserConnections(request.auth.credentials, user),
						getUserConnections(user, request.auth.credentials),
					    getMutualFollowers([user, request.auth.credentials])
					]).then((values: User[][]) => {
						profile['relation'] = {
							followee: values[0].length > 0,
							follower: values[1].length > 0,
							mutual_followees: 0,
							mutual_followers: values[2].length
						};
						return profile;
					});
				});
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/me/followers AND /api/users/{username}/followers
		 * @param request Request-Object
		 * @param request.params.username username (optional)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getFollowers(request: any, reply: any): void {
			let user = request.auth.credentials;
			let username = request.params.username;
			let url = request.connection.info.uri;
			
			// Create user promise.
			let promise : Promise<User> = Promise.resolve(username ? findByUsername(encodeURIComponent(username)) : user);
			promise = promise.then((user: User) => getUserConnections(null, user)).then((users: User[]) => getPublicProfile(users, url));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/me/following AND /api/users/{username}/following
		 * @param request Request-Object
		 * @param request.params.username username (optional)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getFollowees(request: any, reply: any): void {
			let user = request.auth.credentials;
			let username = request.params.username;
			let url = request.connection.info.uri;
			
			// Create user promise.
			let promise : Promise<User> = Promise.resolve(username ? findByUsername(encodeURIComponent(username)) : user);
			promise = promise.then((user: User) => getUserConnections(user, null)).then((users: User[]) => getPublicProfile(users, url));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [PUT] /api/me/following/{followee}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.followee followee
		 * @param reply Reply-Object
		 */
		export function addFollowee(request: any, reply: any): void {
			let user = request.auth.credentials;
			let followeeParam = encodeURIComponent(request.params.followee);
			let promise = findByUsername(followeeParam).then((followee: User) => {
				// Does connection already exist?
				return getUserConnections(user, followee).then((users: User[]) => {
					// Add connection, if not.
					if (users.length == 0) return addUserConnection(user, followee);
				});
			}).then(() => null);
			
			reply.api(promise);
		}
		
		/**
		 * Handles [DELETE] /api/me/following/{followee}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.followee followee
		 * @param reply Reply-Object
		 */
		export function deleteFollowee(request: any, reply: any): void {
			let user = request.auth.credentials;
			let followeeParam = encodeURIComponent(request.params.followee);
			let promise = findByUsername(followeeParam).then((followee: User) => removeUserConnection(user, followee)).then(() => null);
			
			reply.api(promise);
		}
		
		/*
		 var smtpTransport = Nodemailer.createTransport(Config.mailer.options);
		 request.server.render('templates/reset-password-email', {
		 name: user.displayName,
		 appName: Config.app.title,
		 url: 'http://' + request.headers.host + '/auth/reset/' + token
		 }, function (err, emailHTML) {
		 
		 var mailOptions = {
		 to: user.email,
		 from: Config.mailer.from,
		 subject: 'Password Reset',
		 html: emailHTML
		 };
		 smtpTransport.sendMail(mailOptions, function (err) {
		 
		 if (!err) {
		 reply({message: 'An email has been sent to ' + user.email + ' with further instructions.'});
		 } else {
		 return reply(Boom.badRequest('Failure sending email'));
		 }
		 
		 done(err);
		 });
		 });
		 },
		 */
		
		/*
		 function (user, done) {
		 request.server.render('templates/reset-password-confirm-email', {
		 name: user.displayName,
		 appName: Config.app.title
		 }, function (err, emailHTML) {
		 var mailOptions = {
		 to: user.email,
		 from: Config.mailer.from,
		 subject: 'Your password has been changed',
		 html: emailHTML
		 };
		 
		 smtpTransport.sendMail(mailOptions, function (err) {
		 done(err, 'done');
		 });
		 });
		 */
		
		/**
		 * Handles [GET] /api/sign-out
		 * @param request Request-Object
		 * @param reply Reply-Object
		 */
		export function signOut(request: any, reply: any): void {
			let promise = Promise.resolve(jwt.decode(request.auth.token)).then((decodedToken: DecodedToken) => unsignToken).then(() => {});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/sign-up
		 * @param request Request-Object
		 * @param reply Reply-Object
		 */
		export function signUp(request: any, reply: any): void {
			let promise: Promise<any>;
			
			// Check validity.
			if (!request.payload) {
				promise = Promise.reject(Boom.badRequest('Missing payload.'));
			} else {
				promise = createUser({
					username: request.payload.username,
					mail: request.payload.mail,
					password: request.payload.password,
					firstName: request.payload.firstname,
					lastName: request.payload.lastname
				}).then(saveUser).then((user: User) => signToken(user)).then((token: string) => {
					return {
						token: token
					};
				});
			}
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/sign-in
		 * @param request Request-Object
		 * @param reply Reply-Object
		 */
		export function signIn(request: any, reply: any): void {
			let user = request.auth.credentials;
			let promise = signToken(user).then(token => {
				return {
					token: token
				};
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/suggest_username
		 * @param request Request-Object
		 * @param reply Reply-Object
		 */
		export function checkUsername(request: any, reply: any): void {
			let promise = new Promise((resolve, reject) => {
				// Check validity.
				if (!request.payload) {
					reject(Boom.badRequest('Missing payload.'));
					return;
				}
				
				if (!Joi.validate(request.payload.username, Validation.username)) {
					reject(Boom.badRequest('Username has an invalid length or unexpected characters.'));
					return;
				}
				
				resolve(UserController.checkUsername(request.payload.username));
			});
			
			reply.api(promise);
		}
	}
}
