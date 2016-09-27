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
import {Cursor} from "arangojs";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
let arangoCollections = {
	users: 'users',
	activities: 'activities'
};

/**
 * Handles [GET] /api/users/{username}
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function getUser(request: any, reply: any): void {
	let promise = resolveUsername(request, reply).then((user: User) => {
		return dot.transform({
			id: "id",
			username: "username",
			firstName: "firstName",
			lastName: "lastName",
			createdAt: "createdAt"
		}, user);
	});
	
	reply.api(promise);
}

/**
 * Handles [GET] /api/users/{username}/following
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function getFollowees(request: any, reply: any): void {
	let promise = resolveUsername(request, reply).then((user: User) => {
		return dot.transform({
			id: "id",
			username: "username",
			firstName: "firstName",
			lastName: "lastName",
			createdAt: "createdAt"
		}, user);
	});
	
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
	let promise : Promise;
	
	// Check validity.
	console.log(request.payload);
	if(!request.payload ) {
		promise = Promise.reject(Boom.badRequest('Missing payload.'));
	} else {
		promise = createUser({
			username: request.payload.username,
			mail: request.payload.mail,
			password: request.payload.password,
			firstName: request.payload.firstname,
			lastName: request.payload.lastname
		}).then(user => saveUser(user)).then((user: User) => signToken(user)).then((token: string) => {
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

function resolveUsername(request: any, reply: any) {
	// Get user.
	let username = request.params.username;
	return new Promise((resolve, reject) => {
		if (username === 'me') {
			resolve(request.auth.credentials);
			return;
		}
		
		findByUsername(username).then((user: any) => {
			if (!user) {
				reject(Boom.notFound('User not found.'));
				return
			}
			resolve(user);
		});
	});
}

export function createUser(recipe: {
	username: string;
	mail: string;
	password?: string;
	firstName?: string;
	lastName?: string;
}): Promise<User> {
	return new Promise((resolve, reject) => {
		Joi.validate(recipe, {
			username: Validation.username,
			password: recipe.password === undefined ? Validation.password.optional() : Validation.password,
			mail: Validation.mail,
			firstName: Validation.firstName,
			lastName: Validation.lastName,
		}, (err: ValidationError, value) => {
			if (err) {
				reject(Boom.badRequest(err.message));
				return;
			}
			resolve(value);
		});
	}).then(() => {
		return Promise.all([
			findByUsername(recipe.username),
			findByMail(recipe.mail)
		]).then((values: Array<any>) => {
			let taken = values.reduce((previousValue, currentValue) => {
				return previousValue || currentValue !== null;
			}, false);
			if(taken) return Promise.reject(Boom.badRequest('Cannot create user as the username or mail is already in use.'));
		});
	}).then(() => {
		let now = Date.now();
		return <User>{
			firstName: recipe.firstName ? recipe.firstName : null,
			lastName: recipe.lastName ? recipe.lastName : null,
			username: recipe.username,
			mails: [{mail: recipe.mail, verified: false}],
			scope: [UserRoles.user],
			location: null,
			meta: {},
			auth: {
				password: null,
				providers: []
			},
			createdAt: now,
			updatedAt: now
		};
	}).then((user : User) => setPassword(user, recipe.password));
}

/**
 * Handles [POST] /api/check-username
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function checkUsername(request: any, reply: any): void {
	let promise = new Promise((resolve, reject) => {
		// Check validity.
		if(!request.payload ) {
			reject(Boom.badRequest('Missing payload.'));
			return;
		}
		
		if (!Joi.validate(request.payload.username, Validation.username)) {
			reject(Boom.badRequest('Username has an invalid length or unexpected characters.'));
			return;
		}
		
		resolve(recommendUsername(request.payload.username));
	});
	
	reply.api(promise);
}

export function recommendUsername(username: string): Promise<{
	username: string;
	available: boolean;
	recommendations?: Array<string>
}> {
	return new Promise((resolve, reject) => {
		//TODO The recommendation array does return strings greater than 16 chars.
		// Check validity.
		if (!Joi.validate(username, Validation.username)) {
			reject(Boom.badRequest('Username has an invalid length or unexpected characters.'));
			return;
		}
		
		let aql = `
		FOR u in ${arangoCollections.users} 
			FILTER REGEX_TEST(u.username, "^${username}[0-9]*$") 
			RETURN u
		`;
		resolve(arangoClient.query(aql).then(cursor => cursor.map(user => user.username)).then((takenUsernames: Array<string>) => {
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
		}));
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
		let foundTokenData: TokenData = null;
		userDataCache.tokens = userDataCache.tokens.filter((tokenItem: TokenData) => {
			// Delete old expired token.
			let now: number = Date.now();
			if(tokenItem.expiresAt <= now + Config.jwt.deleteIn) return false;
			
			// Extend expiry of an successfully discovered token that is still within the expiry range.
			if (tokenItem.tokenId === token.tokenId) {
				if(tokenItem.expiresAt > now) tokenItem.expiresAt = now + Config.jwt.expiresIn;
				if(includeExpiredTokens || tokenItem.expiresAt > now) foundTokenData = tokenItem;
			}
			
			// Keep token.
			return true;
		});
		
		// Save changes.
		return saveUserDataCache(userDataCache).then(() => foundTokenData);
	});
}

export function signToken(user: User): Promise<String> {
	// Define token.
	let token: DecodedToken = {
		tokenId: Uuid.v4(),
		userId: user._id
	};
	
	return getUserDataCache(user._id).then((userDataCache: UserDataCache) => {
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
		}).then(saveUserDataCache);
	});
}

export function findByProvider(provider: UserProvider): Promise<User> {
	let aql = `
	FOR u IN ${arangoCollections.users}
		FOR p IN u.auth.providers 
		FILTER p.provider == "${provider.provider}" && p.userIdentifier == "${provider.userIdentifier}"
		RETURN u
	`;
	return Promise.resolve<User>(arangoClient.query(aql).then(cursor => handleSingleCursor<User>(cursor)));
}

export function findByUsername(username: string, password: string | boolean = false): Promise<User> {
	return new Promise<User>((resolve, reject) => {
		arangoClient.collection(arangoCollections.users).byExample({username: username}, {limit: 1}).then(cursor => handleSingleCursor<User>(cursor)).then((user: User) => {
			// If no password was given or no user was found, return (empty) result immediately.
			if (!password || !user) return resolve(user);
			
			// Check password.
			bcrypt.compare(password, user.auth.password, (err, isMatch) => {
				if (err || !isMatch) {
					reject(Boom.badRequest('Combination of username and password does not match.'));
					return;
				}
				resolve(user);
			});
		});
	});
}

export function findByMail(mail: string): Promise<User> {
	let aql = `
	FOR u IN ${arangoCollections.users}
		FOR m IN u.mails
            FILTER m.mail == "${mail}" && m.verified == true
            LIMIT 1
            RETURN u
	`;
	return Promise.resolve<User>(arangoClient.query(aql).then(cursor => handleSingleCursor<User>(cursor)));
}

export function findByToken(token: DecodedToken): Promise<User> {
	return getTokenData(token).then((tokenData : TokenData) => {
		if(tokenData === null) return null;
		return arangoClient.collection(arangoCollections.users).byExample({
			_key: token.userId
		}, {limit: 1}).then(cursor => handleSingleCursor<User>(cursor));
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
	return new Promise<User>(resolve => {
		let userCollection = arangoClient.collection(arangoCollections.users);
		resolve(user._key ? userCollection.replace(user._key, user) : userCollection.save(user));
	});
}

function handleSingleCursor<T>(cursor: Cursor) : Promise<T> {
	return cursor.next().then(obj => obj === undefined ? null : obj);
}

function handleArrayCursor<T>(cursor: Cursor): Promise<Array<T>> {
	return cursor.all();
}
