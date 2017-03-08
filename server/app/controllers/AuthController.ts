import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {Config} from "../../../run/config";
import {User} from "../models/users/User";
import {DatabaseManager} from "../Database";
import {DecodedToken, UserDataCache, TokenData} from "../models/Token";
import {AccountController} from "./AccountController";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import _ = require("lodash");

export module AuthController {
	
	interface CheckUsernameResult {
		username: string;
		available: boolean;
		recommendations?: Array<string>
	}
	
	function getUserDataCache(userId: number | string): Promise<UserDataCache> {
		return new Promise<UserDataCache>((resolve, reject) => {
			// Retrieve user in redis.
			let redisKey: string = `user-${userId}`;
			DatabaseManager.redisClient.get(redisKey, (err, reply) => {
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
			DatabaseManager.redisClient.set(redisKey, JSON.stringify(userDataCache), err => {
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
				let now: number = Math.trunc(Date.now() / 1000);
				if (tokenItem.expiresAt <= now + Config.backend.jwt.deleteIn) return false;
				
				// Extend expiry of an successfully discovered token that is still within the expiry range.
				if (tokenItem.tokenId === token.tokenId) {
					if (tokenItem.expiresAt > now) tokenItem.expiresAt = now + Config.backend.jwt.expiresIn;
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
			let now = Math.trunc(Date.now() / 1000);
			
			// Add token.
			userDataCache.tokens.push({
				tokenId: token.tokenId,
				deviceName: 'Device', // TODO
				createdAt: now,
				expiresAt: now + Config.backend.jwt.expiresIn
			});
			return userDataCache;
		}).then(saveUserDataCache).then(() => {
			return new Promise<String>((resolve, reject) => {
				// Sign web token.
				jwt.sign(token, Config.backend.jwt.salt, {
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
					
					tokenItem.expiresAt = Math.trunc(Date.now() / 1000); // Expire.
					resolve(userDataCache);
					return;
				}
				
				reject(Boom.badRequest('Token is invalid.'));
			});
		}).then(saveUserDataCache);
	}
	
	export namespace RouteHandlers {
	
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
			if (!request.payload) {//TODO
				promise = Promise.reject(Boom.badRequest('Missing payload.'));
			} else {
				promise = AccountController.createUser({
					username: request.payload.username,
					mail: request.payload.mail,
					password: request.payload.password,
					firstName: request.payload.firstname,
					lastName: request.payload.lastname
				}).then(AccountController.saveUser).then((user: User) => signToken(user)).then((token: string) => {
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
	}
}
