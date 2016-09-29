import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import bcrypt = require('bcrypt');
import * as Joi from "joi";
import {ValidationError} from "joi";
import {Config} from "../../config/Config";
import {User, UserProvider, Validation, UserRoles} from "../models/User";
import {arangoClient, redisClient} from "../../config/Database";
import {DecodedToken, UserDataCache, TokenData} from "../models/Token";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import {Cursor} from "arangojs";
import {Edge} from "../models/Edge";
let arangoCollections = {
	users: 'users',
	userConnections: 'user-connections',
	activities: 'activities'
};

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
		promise.then((validatedRecipe: UserRecipe) => {
			return Promise.all([
				findByUsername(recipe.username),
				findByMail(recipe.mail)
			]).then(() => validatedRecipe).catch(() => Promise.reject(Boom.badRequest('Cannot create user as the username or mail is already in use.')));
		});
		
		// Create user.
		promise.then((validatedRecipe: UserRecipe) => {
			return <User>{
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
	
	export function checkUsername(username: string): Promise<{
		username: string;
		available: boolean;
		recommendations?: Array<string>
	}> {
		//TODO The recommendation array does return strings greater than 16 chars.
		// Check validity.
		if (!Joi.validate(username, Validation.username)) return Promise.reject(Boom.badRequest('Username has an invalid length or unexpected characters.'));
		
		let aqlQuery = `FOR u in @@collection FILTER REGEX_TEST(u.username, "^@username[0-9]*$") RETURN u`;
		let aqlParams = {
			collection: arangoCollections.users,
			username: username
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
			return saveUserDataCache(userDataCache).then(() => {
				if (foundTokenData) return foundTokenData;
				return Promise.reject(Boom.badRequest('Token is invalid!'));
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
			for (let i = 0; i < userDataCache.tokens.length; i++) {
				let tokenItem = userDataCache.tokens[i];
				if (tokenItem.tokenId != token.tokenId) continue;
				
				tokenItem.expiresAt = Date.now(); // Expire.
				return userDataCache;
			}
			
			return Promise.reject(Boom.badRequest('Token is invalid.'));
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
			collection: arangoCollections.users,
			provider: provider.provider,
			userIdentifier: provider.userIdentifier
		};
		return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => <User><any>cursor.next()).then((user: User) => {
			// No user found?
			if (user === undefined) return Promise.reject(Boom.notFound('User not found.'));
			return user;
		});
	}
	
	export function findByUsername(username: string): Promise<User> {
		let aqlQuery = `FOR u IN @@collection FILTER u.username == @username LIMIT 1 RETURN u`;
		let aqlParams = {
			collection: arangoCollections.users,
			username: username
		};
		return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()).then((user: User) => {
			// No user found?
			if (user === undefined) return Promise.reject(Boom.notFound('User not found.'));
			return user;
		});
	}
	
	export function findByMail(mail: string): Promise<User> {
		let aqlQuery = `FOR u IN @@collection FOR m IN u.mail FILTER m.mail == @mail && m.verified == true LIMIT 1 RETURN u`;
		let aqlParams = {
			collection: arangoCollections.users,
			mail: mail
		};
		return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => <User>cursor.next()).then((user: User) => {
			if (user === undefined) return Promise.reject(Boom.notFound('User not found.'));
			return user;
		});
	}
	
	export function findByToken(token: DecodedToken): Promise<User> {
		return getTokenData(token).then((tokenData: TokenData) => {
			// No token found?
			if (tokenData !== null) return Promise.reject(Boom.notFound('User not found.'));
			
			// Search for user.
			let aqlQuery = `FOR u IN @@collection FILTER u._key == @key LIMIT 1 RETURN u`;
			let aqlParams = {
				collection: arangoCollections.users,
				key: token.userId
			};
			return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => <User>cursor.next()).then((user: User) => {
				if (user === undefined) return Promise.reject(Boom.notFound('User not found.'));
				return user;
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
			collection: arangoCollections.users,
			document: user
		};
		
		return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next());
	}
	
	export function getPublicProfile(user: User): Promise<any> {
		dot.transform({
			id: "id",
			username: "username",
			firstName: "firstName",
			lastName: "lastName",
			createdAt: "createdAt"
		}, user);
		return Promise.resolve(user);
	}
	
	
	export function getUserConnections(from: string | User, to: string | User) : Promise<User[]> {
		let fromUseId = from instanceof User;
		let toUseId = to instanceof User;
		if(fromUseId) from = from['_id'];
		if(toUseId) to = to['_id'];
		
		if(!from && !to) throw('Invalid arguments: At least one argument has to be an user or username.');
		let aqlQuery = from && to ?
			`FOR u IN @@collection FILTER ${fromUseId ? 'u._id' : 'u.username'} == @from FOR v IN OUTBOUND u._id @@edge FILTER ${toUseId ? 'v._id' : 'v.username'} = @to RETURN v` :
			`FOR u IN @@collection FILTER ${(from && fromUseId) || (to && toUseId) ? 'u._id' : 'u.username'} == ${from ? '@from' : '@to'} FOR v IN ${from ? 'OUTBOUND' : 'INBOUND'} u._id @@edge RETURN v`;
		let aqlParam = {
			collection: arangoCollections.users,
			from: from,
			to: to
		};
		return arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => cursor.all());
	}
	
	export function addUserConnection(user: User, aimedUser: string | User) : Promise<Edge> {
		return Promise.resolve(aimedUser).then(aimedUser instanceof User ? aimedUser : findByUsername(<string>aimedUser)).then((user: User) => user._id).then((aimedUserId: string) => {
			let now = Date.now();
			let edge : Edge = {
				_from: user._id,
				_to: aimedUserId,
				createdAt: now,
				updatedAt: now
			};
			
			let aqlQuery = `INSERT @document INTO @@collection RETURN NEW`;
			let aqlParams = {
				collection: arangoCollections.userConnections,
				document: edge
			};
			return arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next());
		});
	}
	
	export function removeUserConnection(user: User, aimedUser: string | User): Promise<Edge> {
		return Promise.resolve(aimedUser).then(aimedUser instanceof User ? aimedUser : findByUsername(aimedUser)).then((user: User) => user._id).then((aimedUserId: string) => {
			let aqlQuery = `FOR e IN @@collection FILTER e._from = @from && e._to = @to REMOVE e`;
			let aqlParams = {
				collection: arangoCollections.userConnections,
				from: user._id,
				to: aimedUserId
			};
			return arangoClient.query(aqlQuery, aqlParams).then(() => {});
		});
	}
	
	export namespace RouteHandlers {
		/**
		 * Handles [GET] /api/users/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param reply Reply-Object
		 */
		export function getUserOf(request: any, reply: any): void {
			let username = encodeURIComponent(request.params.username);
			let promise = findByUsername(username).then(getPublicProfile);
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/me/followers/{follower} AND /api/users/{username}/followers/{follower}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.auth.credentials
		 * @param request.params.follower follower (optional)
		 * @param reply Reply-Object
		 */
		export function getFollowers(request: any, reply: any): void {
			let user : User | string = request.params.username ?
				encodeURIComponent(request.params.username) :
				request.auth.credentials;
			let follower = encodeURIComponent(request.params.follower);
			let promise = getUserConnections(follower, user).then((followers: User[]) => {
				return followers.map(getPublicProfile);
			}).then((followers: any[]) => follower ? followers[0]: followers);
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/me/following/{followee} AND /api/users/{username}/following/{followee}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.auth.credentials
		 * @param request.params.followee followee (optional)
		 * @param reply Reply-Object
		 */
		export function getFollowees(request: any, reply: any): void {
			let user : User | string = request.params.username ?
				encodeURIComponent(request.params.username) :
				request.auth.credentials;
			let followee = encodeURIComponent(request.params.followee);
			let promise = getUserConnections(user, followee).then((followees: User[]) => {
				return followees.map(getPublicProfile);
			}).then((followees: any[]) => followee ? followees[0]: followees);
			
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
			let followee = encodeURIComponent(request.params.followee);
			let promise = addUserConnection(request.auth.credentials, followee).then((edge: Edge) => {});
			
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
			let followee = encodeURIComponent(request.params.followee);
			let promise = removeUserConnection(request.auth.credentials, followee).then(() => {});
			
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
			let promise: Promise<User>;
			
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
