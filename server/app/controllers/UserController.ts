import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import bcrypt = require('bcrypt');
import * as Joi from "joi";
import {Config} from "../../config/Config";
import {User, IUser, IUserProvider, Validation, UserRoles} from "../models/User";
import {redisClient} from "../../config/Database";
import {DecodedToken, UserDataCache, TokenData} from "../models/Token";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import {ValidationError} from "joi";

/**
 * Handles [GET] /api/users/me
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function me(request: any, reply: any): void {
	let user = request.auth.credentials;
	reply.api(dot.transform({
		id: "id",
		username: "username",
		firstName: "firstName",
		lastName: "lastName",
		createdAt: "createdAt"
	}, user));
}


/**
 * Handles [GET] /api/users/{username}
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function getUser(request: any, reply: any): void {
	let user = request.params.username;
	let promise = findByUsername(user).then((user: any) => {
		if (!user) return Promise.reject(Boom.notFound('User not found.'));
		return user;
	}).then((user: IUser) => {
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
	let promise = createUser({
		username: request.payload.username,
		mail: request.payload.mail,
		password: request.payload.password,
		firstName: request.payload.firstname,
		lastName: request.payload.lastname
	}).then(user => user.save()).then((user : IUser) => signToken(user)).then(token => {
		return {
			token: token
		};
	});
	
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

export function createUser(recipe: {
	username: string;
	mail: string;
	password?: string;
	firstName?: string;
	lastName?: string;
}): Promise<IUser> {
	return new Promise((resolve, reject) => {
		Joi.validate(recipe, {
			username: Validation.username,
			password: Validation.password,
			mail: Validation.mail,
			firstName: Validation.firstName,
			lastName: Validation.lastName,
		}, (err: ValidationError, value) => {
			if (err) {
				reject(err);
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
	}).then(() => new User({
		firstName: recipe.firstName,
		lastName: recipe.lastName,
		username: recipe.username,
		mails: {
			primary: recipe.mail
		},
		scope: [
			UserRoles.user
		]
	})).then(user => setPassword(user, recipe.password));
}

/**
 * Handles [POST] /api/check-username
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function checkUsername(request: any, reply: any): void {
	let promise = recommendUsername(request.payload.username);
	
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
		
		resolve(User.find({username: {$regex: `^${username}[0-9]*$`}}).exec().then((users: Array<IUser>) => {
			
			return users.map(user => {
				return user.username;
			});
		}).then((takenUsernames: Array<string>) => {
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

export function setPassword(user: IUser, password?: string): Promise<IUser> {
	return new Promise<IUser>((resolve, reject) => {
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

export function getUserDataCache(userId: number | string): Promise<UserDataCache> {
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

export function saveUserDataCache(userDataCache: UserDataCache): Promise<UserDataCache> {
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

export function signToken(user: IUser): Promise<String> {
	// Define token.
	let token: DecodedToken = {
		tokenId: Uuid.v4(),
		userId: user.id
	};
	
	return getUserDataCache(user.id).then((userDataCache: UserDataCache) => {
		// Add token.
		userDataCache.tokens.push({
			tokenId: token.tokenId,
			deviceName: 'Device', // TODO
			createdAt: Date.now(),
			expiresAt: Date.now() + Config.jwt.expiresIn
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

export function findByProvider(provider: IUserProvider): Promise<IUser> {
	return Promise.resolve<IUser>(User.findOne({
		$and: [
			{'auth.providers.provider': provider.provider},
			{'auth.providers.userIdentifier': provider.userIdentifier}
		]
	}).exec());
}

export function findByUsername(username: string, password: string | boolean = false): Promise<IUser> {
	return new Promise<IUser>((resolve, reject) => {
		User.findOne({username: username}, (err, user: IUser) => {
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

export function findByMail(mail: string): Promise<IUser> {
	return Promise.resolve<IUser>(User.findOne({
		'mails.primary': mail
	}).exec());
}

export function findByToken(token: DecodedToken): Promise<IUser> {
	return getTokenData(token).then((tokenData : TokenData) => tokenData ? User.findOne({
		_id: token.userId
	}).exec() : null);
}

export function addProvider(user: IUser, provider: IUserProvider, save: boolean = false): Promise<IUser> {
	return new Promise<IUser>(resolve => {
		let existingProviderIndex: number = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
		if (existingProviderIndex >= 0)
			user.auth.providers[existingProviderIndex] = provider;
		else
			user.auth.providers.push(provider);
		return resolve(save ? user.save() : user);
	});
}

export function removeProvider(user: IUser, provider: IUserProvider, save: boolean = false): Promise<IUser> {
	return new Promise<IUser>(resolve => {
		let existingProviderIndex: number = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
		if (existingProviderIndex >= 0) user.auth.providers.splice(existingProviderIndex, 1);
		return resolve(save ? user.save() : user);
	});
}
