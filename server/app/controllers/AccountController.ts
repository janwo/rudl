import * as Boom from 'boom';
import * as Path from 'path';
import {Config} from '../../../run/config';
import {User, UserRoles, UserSettings} from '../models/user/User';
import {Node} from '../models/Node';
import {Notification, NotificationType} from '../models/notification/Notification';
import {DatabaseManager, TransactionSession} from '../Database';
import {UserController} from './UserController';
import * as sharp from 'sharp';
import Transaction from 'neo4j-driver/lib/v1/transaction';
import {AuthController} from './AuthController';
import * as shortid from 'shortid';
import * as dot from 'dot-object';
import * as faker from 'faker';
import * as fs from 'fs';
import {Expedition} from '../models/expedition/Expedition';
import {ExpeditionController} from './ExpeditionController';
import {RudelController} from './RudelController';
import {Rudel} from '../models/rudel/Rudel';
import {UtilController} from './UtilController';
import Integer from 'neo4j-driver/lib/v1/integer';
import {MailManager} from '../Mail';
import {CommentController} from "./CommentController";

export module AccountController {
	
	interface UserRecipe {
		id: string;
		username: string;
		mail: string;
		password?: string;
		firstName: string;
		lastName: string;
	}
	
	export function create(transaction: Transaction, recipe: UserRecipe): Promise<User> {
		return Promise.all([
			UserController.findByUsername(transaction, recipe.username),
			UserController.findByMail(transaction, recipe.mail)
		]).then((values: User[]) => {
			if (values[0] || values[1]) return transaction.rollback().then(() => {
				return Promise.reject<User>('Cannot create user as the username or mail is already in use.');
			});
			
			// Create user.
			let user: User = {
				firstName: recipe.firstName,
				lastName: recipe.lastName,
				username: recipe.username,
				id: recipe.id,
				scope: [UserRoles.user],
				location: {
					longitude: null,
					latitude: null
				},
				languages: [
					//TODO: dynamic language
					'de',
					'en'
				],
				avatarId: null,
				profileText: null,
				onBoard: false,
				mails: {
					primary: {
						mail: recipe.mail,
						verified: false
					},
					secondary: {
						mail: recipe.mail,
						verified: false
					}
				},
				password: AuthController.hashPassword(recipe.password)
			};
			
			return this.save(transaction, user).then(() => {
				return UserSettingsController.update(transaction, user, {
					notificationMails: true,
					newsletterMails: true
				});
			}).then(() => user);
		});
	}

	export function normalizeUsername(username: string, increment: boolean, min = 5, max = 16): string {
        if(!username || username.length == 0) username = 'user';

        if(username.length < min) {
            increment = true;
        } else if (username.length > max) {
            username = username.substring(0, max);
        }

        if(increment) {
            let matches = username.match(/^(.*?)(\d*)$/i);
            let number = matches[2] ? parseInt(matches[2]) + 1 : 1;
            let alphabetics = matches[1];
            let missingDigits = Math.max(0, min - alphabetics.length - number.toString().length);
            let stringifiedNumber = '0'.repeat(missingDigits) + number;
            username = alphabetics.substring(0, max - stringifiedNumber.length) + stringifiedNumber;
        }

        return username;
    }
	
	export function availableUsername(transaction: Transaction, username: string): Promise<string> {
        username = username.replace(/[^a-z0-9_]/g, '');

		let nextAvailableUsername = (username: string, increment = false): Promise<string> => {
			username = this.normalizeUsername(username, increment);
			return UserController.findByUsername(transaction, username).then((user: User) => {
				return user ? nextAvailableUsername(username, true) : username;
			});
		};
		
		return nextAvailableUsername(username);
	}

    export function save(transaction: Transaction, user: User): Promise<void> {
        // Set timestamps.
        let now = Math.trunc(Date.now() / 1000);
        if (!user.createdAt) user.createdAt = now;
        user.updatedAt = now;

        // Save.
        return transaction.run("MERGE (u:User { username: $user.username }) ON CREATE SET u = $flattenUser ON MATCH SET u = $flattenUser", {
            user: user,
            flattenUser: DatabaseManager.neo4jFunctions.flatten(user)
        }).then(() => {});
    }

    export function terminate(transaction: Transaction, user: User): Promise<void> {
	    let dislikeRudel = (): Promise<any> => RudelController.findByUser(transaction, user, false, 0, 100).then((rudel: Rudel[]) => {
            let promises = rudel.map((rudel: Rudel) => RudelController.dislike(transaction, rudel, user));
            if(promises.length > 0) return Promise.all(promises).then(() => dislikeRudel());
        });

	    return dislikeRudel().then(() => {
            return transaction.run("MATCH (u:User { id: $userId }) OPTIONAL MATCH (u)-[:USER_SETTINGS]->(s:Settings) OPTIONAL MATCH (u)-[:USES_AUTH_PROVIDER]->(uap:UserAuthProvider) CALL apoc.index.removeNodeByName('User', u) DETACH DELETE u, s, uap", {
                userId: user.id
            });
        }).then(() => {
	        return Promise.all([
                CommentController.removeDetachedComments(transaction),
                AccountController.NotificationController.removeDetachedNotifications(transaction)
            ]);
        }).then(() => {});
    }
	
	export enum AvatarSizes {
		small = 100, medium = 400, large = 700
	}
	
	export function getAvatarPath(user: User, size: AvatarSizes = AvatarSizes.small, salt: string = null): string {
		return Path.resolve(Config.paths.avatars.dir, `${user.id}-${AvatarSizes[size]}-${salt ? salt : user.avatarId}.png`);
	}
	
	export function getAvatarLink(user: User, size: AvatarSizes = AvatarSizes.small, salt: string = null): string {
		return `${Config.backend.domain + Config.paths.avatars.publicPath + user.id}-${AvatarSizes[size]}-${salt ? salt : user.avatarId}.png`;
	}
	
	export function deleteAvatar(user: User): Promise<User> {
		let unlinkOldAvatars = user.avatarId ? [
			AvatarSizes.small,
			AvatarSizes.medium,
			AvatarSizes.large
		].map((size: AvatarSizes) => {
			return new Promise((resolve, reject) => {
				let path = AccountController.getAvatarPath(user, size, user.avatarId);
				fs.exists(path, exists => {
					if(!exists) resolve();
					fs.unlink(path, err => {
						if(err) reject(err);
						resolve();
					});
				});
			});
		}) : [];
		return Promise.all(unlinkOldAvatars).then(() => {
			user.avatarId = null;
			return user;
		});
	}
	
	export namespace UserSettingsController {
		export function update(transaction: Transaction, user: User, settings: UserSettings): Promise<UserSettings> {
			return transaction.run("MATCH (u:User { id: $userId }) MERGE (u)-[:USER_SETTINGS]->(s:Settings) ON CREATE SET s = $flattenSettings ON MATCH SET s = apoc.map.merge(s, $flattenSettings) RETURN properties(s) as s", {
				userId: user.id,
				flattenSettings: DatabaseManager.neo4jFunctions.flatten(settings)
			}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 's').shift());
		}

		export function get(transaction: Transaction, user: User): Promise<UserSettings> {
			return transaction.run("MATCH (:User { id: $userId })-[:USER_SETTINGS]->(s:Settings) RETURN properties(s) as s", {
				userId: user.id
			}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 's').shift());
		}

		export function getPublicUserSettings(transaction: Transaction, settings: UserSettings): Promise<any | any[]> {
			return Promise.resolve(dot.transform({
				'settings.notificationMails': 'notificationMails',
				'settings.newsletterMails': 'newsletterMails'
			}, {
				settings: settings
			}));
		}
	}
	
	export namespace NotificationController {
		export function get(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Notification[]> {
			return transaction.run<Notification, any>(`MATCH(u:User {id: $userId}) OPTIONAL MATCH (u)<-[:NOTIFICATION_RECIPIENT]-(n:Notification) WITH n, u ORDER BY n.createdAt DESC SKIP $skip LIMIT $limit MATCH (n)-[:NOTIFICATION_SENDER]->(sender:User), (n)-[:NOTIFICATION_SUBJECT]->(subject) WITH subject, sender, n, u OPTIONAL MATCH (n)<-[nur:NOTIFICATION_UNREAD]-(u) WITH apoc.map.setKey( apoc.map.setKey( apoc.map.setKey( properties(n), 'subject', properties(subject)), 'sender', properties(sender)), 'unread', COUNT(nur) > 0) as n ORDER BY n.createdAt DESC RETURN COALESCE(n, []) as n`, {
				userId: user.id,
				limit: limit,
				skip: skip
			}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'n'));
		}
		
		export function markAsRead(transaction: Transaction, user: User): Promise<void> {
			return transaction.run<Notification, any>(`MATCH(u:User {id: $userId}) OPTIONAL MATCH (u)-[nur:NOTIFICATION_UNREAD]->(:Notification) DETACH DELETE nur`, {
				userId: user.id
			}).then(() => {});
		}
		
		export function countUnread(transaction: Transaction, user: User): Promise<number> {
			return transaction.run<Notification, any>(`MATCH(u:User {id: $userId}) OPTIONAL MATCH (u)-[nur:NOTIFICATION_UNREAD]->(:Notification) RETURN COUNT(nur) as unread`, {
				userId: user.id
			}).then(results => Integer.toNumber(results.records.shift().get('unread') as any as Integer));
		}
		
		export function removeDetachedNotifications(transaction: Transaction): Promise<void> {
			return transaction.run(`MATCH (n:Notification) WHERE NOT ()<-[:NOTIFICATION_SUBJECT]-(n) OR NOT ()<-[:NOTIFICATION_SENDER]-(n) OR NOT ()<-[:NOTIFICATION_RECIPIENT]-(n) DETACH DELETE n`).then(() => {});
		}
		
		export function getPublicNotification(transaction: Transaction, notification: Notification | Notification[], relatedUser: User): Promise<any | any[]> {
			let createPublicNotification = (notification: Notification): Promise<any> => {
				let userProfilePromise = UserController.getPublicUser(transaction, notification.sender, relatedUser, true);
				let subjectProfilePromise;
				switch(notification.type) {
                    case NotificationType.COMMENTED_EXPEDITION:
                    case NotificationType.ADDED_EXPEDITION:
					case NotificationType.JOINED_EXPEDITION:
					case NotificationType.LEFT_EXPEDITION:
					case NotificationType.REJECTED_FROM_EXPEDITION:
					case NotificationType.INVITED_TO_EXPEDITION:
					case NotificationType.ACCEPTED_INVITATION_FOR_EXPEDITION:
					case NotificationType.REJECTED_INVITATION_FOR_EXPEDITION:
					case NotificationType.APPLIED_FOR_EXPEDITION:
					case NotificationType.ACCEPTED_APPLICATION_FOR_EXPEDITION:
					case NotificationType.REJECTED_APPLICATION_FOR_EXPEDITION:
						subjectProfilePromise = ExpeditionController.getPublicExpedition(transaction, notification.subject as any as Expedition, relatedUser, true);
						break;

                    case NotificationType.LIKES_RUDEL:
                        subjectProfilePromise = RudelController.getPublicRudel(transaction, notification.subject as any as Rudel, relatedUser, true);
                        break;

                    case NotificationType.LIKES_USER:
                        subjectProfilePromise = UserController.getPublicUser(transaction, notification.subject as any as User, relatedUser, true);
                        break;
				}
				
				return Promise.all([
					userProfilePromise,
					subjectProfilePromise
				]).then((values: [User]) => {
					// Build profile.
					return Promise.resolve(dot.transform({
						'notification.type': 'type',
						'sender': 'sender',
						'subject': 'subject',
						'notification.unread': 'unread',
						'createdAt': 'createdAt'
					}, {
						notification: notification,
						createdAt: UtilController.isoDate(notification.createdAt),
						sender: values[0],
						subject: values[1]
					}));
				});
			};
			
			let now = Date.now();
			let transformed = notification instanceof Array ? Promise.all(notification.map(createPublicNotification)) : createPublicNotification(notification);
			return transformed.then((result: any | Array<any>) => {
				console.log(`Building profile of ${result instanceof Array ? result.length + ' notifications' : '1 notification'} took ${Date.now() - now} millis`);
				return result;
			});
		}
		
		export function set(transaction: Transaction, type: NotificationType, recipient: User, subject: Node, sender: User): Promise<void> {
			let query = `MATCH(subject {id : $subjectId }), (recipient:User {id: $recipientId}), (sender:User {id: $senderId})
				CREATE UNIQUE (sender)<-[:NOTIFICATION_SENDER]-(n:Notification {type: $type, createdAt: $now})-[:NOTIFICATION_SUBJECT]->(subject), (n)<-[:NOTIFICATION_UNREAD]-(recipient), (n)-[:NOTIFICATION_RECIPIENT]->(recipient)`;
			return transaction.run(query, {
				type: type,
				recipientId: recipient.id,
				subjectId: subject.id,
				senderId: sender.id,
				now: Math.trunc(new Date().getTime() / 1000)
			}).then(() => {});
		}
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [GET] /api/account/notifications
		 * @param request Request-Object
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function notifications(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = AccountController.NotificationController.get(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((notifications: Notification[]) => {
				return AccountController.NotificationController.markAsRead(transaction, request.auth.credentials).then(() => {
					return AccountController.NotificationController.getPublicNotification(transaction, notifications, request.auth.credentials);
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/account/update
		 * @param request Request-Object
		 * @param request.payload.profileText profileText
		 * @param request.payload.firstName firstName
		 * @param request.payload.lastName lastName
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function update(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			
			// Update user.
			if (request.payload.profileText) request.auth.credentials.profileText = request.payload.profileText;
			if (request.payload.firstName) request.auth.credentials.firstName = request.payload.firstName;
			if (request.payload.lastName) request.auth.credentials.lastName = request.payload.lastName;
			//TODO illustrations und location auch hierüber laufen lassen
			let promise = AccountController.save(transaction, request.auth.credentials).then(() => {
				return UserController.getPublicUser(transaction, request.auth.credentials, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}

		/**
		 * Handles [POST] /api/account/terminate
		 * @param request Request-Object
		 * @param request.payload.username username
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function terminate(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = Promise.resolve(request.payload.username).then(username => {
                if (username != request.auth.credentials.username) return Promise.reject(Boom.notFound('Username does not match.'));
                return AccountController.terminate(transaction, request.auth.credentials).then(() => {});
            });

			reply.api(promise, transactionSession);
		}

		/**
		 * Handles [POST] /api/account/delete-avatar
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function deleteAvatar(request: any, reply: any): void {
			let user: User = request.auth.credentials;
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = new Promise(resolve => {
				// Has no avatar? Done!
				if(!user.avatarId) return resolve();
				let promise = AccountController.deleteAvatar(user).then((user: User) => {
					return AccountController.save(transaction, user).then(() => {
						return UserController.getPublicUser(transaction, user, user);
					});
				});
				resolve(promise);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/account/avatar
		 * @param request Request-Object
		 * @param request.payload.file uploaded avatar file
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function uploadAvatar(request: any, reply: any): void {
			let user = request.auth.credentials;
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			// Create sharp instance.
			let transformer = sharp().rotate().png();
			request.payload.file.pipe(transformer);
			
			// Make paths retrievable.
			let newSalt = shortid.generate();
			let sizes = [
				AvatarSizes.small,
				AvatarSizes.medium,
				AvatarSizes.large
			];
			
			// Set transformation streams.
			let createNewAvatars = sizes.map((size: AvatarSizes) => {
				return transformer.clone().resize(size, size).max().crop(sharp.strategy.entropy).toFile(AccountController.getAvatarPath(user, size, newSalt))
			});
			
			// Execute transformations, update and return user profile.
			let promise = Promise.all(createNewAvatars).then(() => {
				return AccountController.deleteAvatar(user).then((user: User) => {
					user.avatarId = newSalt;
					return AccountController.save(transaction, user).then(() => {
						return UserController.getPublicUser(transaction, user, user);
					});
				});
			}, (err) => Promise.reject(err));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/account/location
		 * @param request Request-Object
		 * @param request.payload.longitude longitude
		 * @param request.payload.latitude latitude
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function updateLocation(request: any, reply: any): void {
			// Update location.
			let user = request.auth.credentials;
			
			user.location = {
				latitude: request.payload.latitude,
				longitude: request.payload.longitude
			};
			
			// Save user.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = AccountController.save(transaction, user).then(() => {
				return UserController.getPublicUser(transaction, user, user);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/account/illustrations
		 * @param request Request-Object
		 * @param request.payload.boarded boarded
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function updateBoarding(request: any, reply: any): void {
			// Update location.
			let user = request.auth.credentials;
			user.onBoard = request.payload.boarded;
			
			// Save user.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = AccountController.save(transaction, user).then(() => {
				return UserController.getPublicUser(transaction, user, user);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/account/settings
		 * @param request Request-Object
		 * @param request.payload.settings settings
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function updateSettings(request: any, reply: any): void {
			// Save user.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = AccountController.UserSettingsController.update(transaction, request.auth.credentials, request.payload.settings).then((settings: UserSettings) => {
				return AccountController.UserSettingsController.getPublicUserSettings(transaction, settings);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/account/settings
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function settings(request: any, reply: any): void {
			// Save user.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = AccountController.UserSettingsController.get(transaction, request.auth.credentials).then((settings: UserSettings) => {
				return AccountController.UserSettingsController.getPublicUserSettings(transaction, settings);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/account/check-username/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param reply Reply-Object
		 */
		export function checkUsername(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = AccountController.availableUsername(transaction, request.params.username).then((username: string) => {
				let obj: any = {
					available: request.params.username == username
				};
				if (!obj.available) obj.suggestion = username;
				return obj;
			});
			
			reply.api(promise, transactionSession);
		}
	}
}