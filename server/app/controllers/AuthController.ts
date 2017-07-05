import * as shortid from 'shortid';
import * as jwt from 'jsonwebtoken';
import {Config} from '../../../run/config';
import {User} from '../models/user/User';
import {DatabaseManager, TransactionSession} from '../Database';
import {DecodedToken, TokenData, UserDataCache} from '../models/Token';
import {AccountController} from './AccountController';
import {UserAuthProvider} from '../models/user/UserAuthProvider';
import * as CryptoJS from 'crypto-js';
import Transaction from 'neo4j-driver/lib/v1/transaction';
import Session from 'neo4j-driver/lib/v1/session';

export module AuthController {
	
	export function hashPassword(password: string): string {
		return CryptoJS.SHA256(password, Config.backend.salts.password).toString();
	}
	
	export function authByProvider(provider: UserAuthProvider): Promise<User> {
		let session = DatabaseManager.neo4jClient.session();
		return session.run("MATCH(:UserAuthProvider {provider: $provider.provider, identifier: $provider.identifier})<-[:USES_AUTH_PROVIDER]-(u:User) RETURN properties(u) as u LIMIT 1", {
			provider: provider
		}).then((results: any) => {
			session.close();
			return DatabaseManager.neo4jFunctions.unflatten(results.records, 'u').pop();
		}, (err: any) => {
			session.close();
			return Promise.reject(err);
		});
	}
	
	export function addAuthProvider(transaction: Transaction, username: string, provider: UserAuthProvider): Promise<void> {
		return transaction.run("MATCH(u:User {username: $username}) MERGE (ap:UserAuthProvider {provider: $provider.provider, identifier: $provider.identifier})<-[:USES_AUTH_PROVIDER]-(u) ON MATCH SET ap = $flattenProvider ON CREATE SET ap = $flattenProvider", {
			username: username,
			provider: provider,
			flattenProvider: DatabaseManager.neo4jFunctions.flatten(provider)
		}).then(() => {});
	}
	
	export function removeAuthProvider(transaction: Transaction, provider: UserAuthProvider): Promise<void> {
		return transaction.run("MATCH(ap:UserAuthProvider {provider: $provider.provider, identifier: $provider.identifier}) DETACH DELETE ap", {
			provider: provider
		}).then(() => {});
	}
	
	export function authByMail(mail: string, password: string): Promise<User> {
		let session = DatabaseManager.neo4jClient.session();
		return session.run(`MATCH(u:User {password: $password}) WHERE (u.mails_primary_mail = $mail AND u.mails_primary_verified) OR (u.mails_secondary_mail = $mail AND u.mails_secondary_verified) RETURN properties(u) as u LIMIT 1`, {
			mail: mail,
			password: this.hashPassword(password)
		}).then((results: any) => {
			session.close();
			return DatabaseManager.neo4jFunctions.unflatten(results.records, 'u').pop();
		}, (err: any) => {
			session.close();
			return Promise.reject(err);
		});
	}
	
	export function authByToken(token: DecodedToken): Promise<User> {
		return this.getTokenData(token).then(() => {
			let session: Session = DatabaseManager.neo4jClient.session();
			return session.run(`MATCH(u:User {id: $userId}) RETURN COALESCE(properties(u), []) as u LIMIT 1`, {
				userId: token.userId
			}).then((results: any) => {
				session.close();
				return DatabaseManager.neo4jFunctions.unflatten(results.records, 'u').pop();
			}, (err: any) => {
				session.close();
				return Promise.reject(err);
			});
		});
	}
	
	export function getUserDataCache(userId: string): Promise<UserDataCache> {
		return new Promise<UserDataCache>((resolve, reject) => {
			// Retrieve user in redis.
			let redisKey: string = `user-${userId}`;
			DatabaseManager.redisClient.get(redisKey, (err: any, reply: any) => {
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
			return AuthController.saveUserDataCache(userDataCache).then((userDataCache: UserDataCache) => {
				if (!foundTokenData) return Promise.reject<TokenData>('Token is invalid!');
				return foundTokenData;
			});
		});
	}
	
	export function signToken(user: User): Promise<string> {
		// Define token.
		let token: DecodedToken = {
			tokenId: shortid.generate(),
			userId: user.id
		};
		
		return getUserDataCache(user.id).then((userDataCache: UserDataCache) => {
			let now = Math.trunc(Date.now() / 1000);
			
			// Add token.
			userDataCache.tokens.push({
				tokenId: token.tokenId,
				deviceName: 'Device', // TODO
				createdAt: now,
				expiresAt: now + Config.backend.jwt.expiresIn
			});
			return userDataCache;
		}).then(userDataCache => AuthController.saveUserDataCache(userDataCache)).then(() => {
			return new Promise<string>((resolve, reject) => {
				// Sign web token.
				jwt.sign(token, Config.backend.salts.jwt, {
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
				
				tokenItem.expiresAt = Math.trunc(Date.now() / 1000); // Expire.
				return userDataCache;
			}
			
			return Promise.reject<UserDataCache>('Token is invalid.');
		}).then(userDataCache => AuthController.saveUserDataCache(userDataCache));
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [GET] /api/sign-out
		 * @param request Request-Object
		 *
		 * @param reply Reply-Object
		 */
		export function signOut(request: any, reply: any): void {
			let promise = Promise.resolve(jwt.decode(request.auth.token)).then((decodedToken: DecodedToken) => AuthController.unsignToken(decodedToken)).then(() => {});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/sign-up
		 * @param request Request-Object
		 * @param reply Reply-Object
		 */
		export function signUp(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = AccountController.create(transaction, {
				username: request.payload.username,
				id: shortid.generate(),
				mail: request.payload.mail,
				password: AuthController.hashPassword(request.payload.password),
				firstName: request.payload.firstname,
				lastName: request.payload.lastname
			}).then((user: User) => AuthController.signToken(user)).then((token: string) => {
				return {
					token: token
				};
			});
			
			reply.api(promise, transactionSession);
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
