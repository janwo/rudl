import * as shortid from 'shortid';
import * as jwt from 'jsonwebtoken';
import {Config} from '../../../run/config';
import {User} from '../models/user/User';
import {DatabaseManager, TransactionSession} from '../Database';
import {DecodedToken, TokenData, UserDataCache} from '../models/Token';
import {AccountController} from './AccountController';
import {UserAuthProvider} from '../models/user/UserAuthProvider';
import * as CryptoJS from 'crypto-js';
import {StatementResult} from 'neo4j-driver/types/v1/result';
import Transaction from 'neo4j-driver/types/v1/transaction';
import Session from 'neo4j-driver/types/v1/session';
import {MailManager} from "../Mail";
import * as Boom from "boom";
import {UserController} from "./UserController";
import {MonitorManager} from "../MonitorManager";
import {Counter} from "prom-client";

export module AuthController {

    export function generateRedisKey(id: string, suffix: string = null) : string {
        return suffix ? `user-${id}#${suffix}` : `user-${id}`;
    }
	
	export function hashPassword(password: string): string {
		return CryptoJS.SHA256(password, Config.backend.salts.password).toString();
	}
	
	export function authByProvider(provider: UserAuthProvider): Promise<User> {
		let session = DatabaseManager.neo4jClient.session();
		return session.run("MATCH(:UserAuthProvider {provider: $provider.provider, identifier: $provider.identifier})<-[:USES_AUTH_PROVIDER]-(u:User) RETURN properties(u) as u LIMIT 1", {
			provider: provider
		}).then((results: any) => {
			session.close();
			return DatabaseManager.neo4jFunctions.unflatten(results.records, 'u').shift();
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
	
	export function authByToken(token: DecodedToken): Promise<User> {
		return this.getTokenData(token).then(() => {
			let session: Session = DatabaseManager.neo4jClient.session();
			return session.run(`MATCH(u:User {id: $userId}) RETURN COALESCE(properties(u), []) as u LIMIT 1`, {
				userId: token.userId
			}).then((results: any) => {
				session.close();
				return DatabaseManager.neo4jFunctions.unflatten(results.records, 'u').shift();
			}, (err: any) => {
				session.close();
				return Promise.reject(err);
			});
		});
	}
	
	export function getUserDataCache(userId: string): Promise<UserDataCache> {
		return new Promise<UserDataCache>((resolve, reject) => {
            // Retrieve user in redis.
            DatabaseManager.redisClient.get(AuthController.generateRedisKey(userId), (err: any, reply: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(Object.assign({
                    userId: userId,
                    tokens: [],
                    singleTokens: {}
                }, JSON.parse(reply)));
            });
        });
	}
	
	export function saveUserDataCache(userDataCache: UserDataCache): Promise<UserDataCache> {
    	userDataCache.updatedAt = Math.trunc(Date.now() / 1000);
		return new Promise<UserDataCache>((resolve, reject) => {
			// Retrieve user in redis.
			DatabaseManager.redisClient.set(AuthController.generateRedisKey(userDataCache.userId), JSON.stringify(userDataCache), err => {
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
		return AuthController.getUserDataCache(token.userId).then((userDataCache: UserDataCache) => {
			for (let i = 0; i < userDataCache.tokens.length; i++) {
				let tokenItem = userDataCache.tokens[i];
				if (tokenItem.tokenId != token.tokenId) continue;
				
				tokenItem.expiresAt = Math.trunc(Date.now() / 1000); // Expire.
				return userDataCache;
			}
			
			return Promise.reject<UserDataCache>('Token is invalid.');
		}).then(userDataCache => AuthController.saveUserDataCache(userDataCache));
	}

    export function sendResetPasswordInstructions(user: User): Promise<void> {
        return AuthController.getUserDataCache(user.id).then((userDataCache: UserDataCache) => {
            userDataCache.singleTokens.resetPassword = shortid.generate();
            return AuthController.saveUserDataCache(userDataCache).then(() => {
                return MailManager.sendResetPasswordMail({
                    to: user.mail,
                    name: user.firstName,
                    resetPasswordLink: `${Config.backend.domain}/set-password?mail=${encodeURIComponent(user.mail)}&token=${encodeURIComponent(userDataCache.singleTokens.resetPassword)}`,
                    locale: user.languages.shift()
                });
            });
        });
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
				firstName: request.payload.firstName,
				lastName: request.payload.lastName
			}).then((user: User) => Promise.all([
                AuthController.signToken(user),
                user
            ]));

            transactionSession.finishTransaction(promise).then((values: [string, User]) => {
                // Track.
                (MonitorManager.metrics.newUsers as Counter).labels('email').inc(1, Date.now());

                // Send mail.
                let promise : Promise<any> = MailManager.sendWelcomeMail({
                    to: values[1].mail,
                    name: values[1].firstName,
                    locale: values[1].languages.shift(),
                    provider: 'Mail'
                }).then(() => {
                    return {
                        token: values[0]
                    };
                });

                reply.api(promise);
            }, (err: any) => {
                reply(Boom.badRequest(err));
            });
		}

        /**
         * Handles [POST] /api/sign-in
         * @param request Request-Object
         * @param request.payload.mail mail
         * @param request.payload.password password
         * @param reply Reply-Object
         */
        export function signIn(request: any, reply: any): void {
            let transactionSession = new TransactionSession();
            let transaction = transactionSession.beginTransaction();
            let promise: Promise<any> = UserController.findByMail(transaction, request.payload.mail).then((user: User) => {
                if(!user || user.password != AuthController.hashPassword(request.payload.password)) return Promise.reject(Boom.unauthorized('Credentials are wrong.'));
                return signToken(user).then((token: string) => {
                    return {
                        token: token
                    };
                });
            });

            reply.api(promise, transactionSession);
        }

        /**
         * Handles [POST] /api/forgot-password
         * @param request Request-Object
         * @param request.payload.mail mail
         * @param reply Reply-Object
         */
        export function forgotPassword(request: any, reply: any): void {
            let transactionSession = new TransactionSession();
            let transaction = transactionSession.beginTransaction();
            let promise: Promise<any> = UserController.findByMail(transaction, request.payload.mail).then((user: User) => {
                if(!user) return Promise.reject(Boom.badData('Unknown user mail.'));

                return AuthController.sendResetPasswordInstructions(user);
            });

            reply.api(promise, transactionSession);
        }

        /**
         * Handles [POST] /api/set-password
         * @param request Request-Object
         * @param request.payload.mail mail
         * @param request.payload.token token
         * @param request.payload.password password
         * @param reply Reply-Object
         */
        export function setPassword(request: any, reply: any): void {
            let transactionSession = new TransactionSession();
            let transaction = transactionSession.beginTransaction();
            let promise: Promise<any> = UserController.findByMail(transaction, request.payload.mail).then((user: User) => {
                if(!user) return Promise.reject(Boom.badData('Unknown user mail.'));

                return AuthController.getUserDataCache(user.id).then(userDataCache => {
                    if(userDataCache.singleTokens.resetPassword !== request.payload.token) return AuthController.sendResetPasswordInstructions(user).then(() => {
                       return Promise.reject(Boom.badData('Token is not valid.'));
                    });

                    delete userDataCache.singleTokens.resetPassword;
                    return AuthController.saveUserDataCache(userDataCache).then(() => {
                        user.password = AuthController.hashPassword(request.payload.password);
                        return AccountController.save(transaction, user);
                    });
                });
            });

            reply.api(promise, transactionSession);
        }
	}
}
