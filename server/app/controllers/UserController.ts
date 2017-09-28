import * as Boom from 'boom';
import * as dot from 'dot-object';
import Transaction from 'neo4j-driver/types/v1/transaction';
import {Config} from '../../../run/config';
import {User} from '../models/user/User';
import {DatabaseManager, TransactionSession} from '../DatabaseManager';
import {AccountController} from './AccountController';
import {UtilController} from './UtilController';
import {StatementResult} from 'neo4j-driver/types/v1/result';
import {UserStatistics} from '../../../client/app/models/user';
import {NotificationType} from "../models/notification/Notification";

export module UserController {
	
	export function findByFulltext(transaction: Transaction, query: string, skip = 0, limit = 25): Promise<User[]> {
		return transaction.run('CALL apoc.index.search("User", $query) YIELD node WITH properties(node) AS u RETURN u SKIP $skip LIMIT $limit', {
			query: `${DatabaseManager.neo4jFunctions.escapeLucene(query)}~`,
			skip: skip,
			limit: limit
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'u'));
	}
	
	export function findByUsername(transaction: Transaction, username: string): Promise<User> {
		return transaction.run('MATCH(u:User {username: $username}) RETURN COALESCE(properties(u), []) AS u LIMIT 1', {
			username: username
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'u').shift());
	}
	
	export function findByMail(transaction: Transaction, mail: string): Promise<User> {
		return transaction.run('MATCH(u:User {mail: $mail}) RETURN COALESCE(properties(u), []) AS u LIMIT 1', {
			mail: mail
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'u').shift());
	}
	
	export interface UserStatistics {
		rudel: number;
		likers: number;
		likees: number;
		lists: number;
		mutualLikers?: number;
		mutualLikees?: number;
		isLiker?: boolean;
		isLikee?: boolean;
	}
	
	export function getStatistics(transaction: Transaction, user: User, relatedUser: User): Promise<UserStatistics> {
		// Set queries.
		let queries: string[] = [
			"MATCH (user:User {id: $userId})",
			"OPTIONAL MATCH (user)-[fr:LIKES_RUDEL]->() WITH COUNT(fr) AS rudelCount, user",
			"OPTIONAL MATCH (user)-[fl:LIKES_LIST]->() WITH rudelCount, COUNT(fl) AS listsCount, user",
			"OPTIONAL MATCH (user)-[:LIKES_USER]->(fes:User) WITH rudelCount, listsCount, COLLECT(fes) AS likees, COUNT(fes) AS likeesCount, user",
			"OPTIONAL MATCH (user)<-[:LIKES_USER]-(frs:User) WITH rudelCount, listsCount, likees, likeesCount, COLLECT(frs) AS likers, COUNT(frs) AS likersCount, user"
		];
		
		let transformations: string[] = [
			"rudel: rudelCount",
			"lists: listsCount",
			"likees: likeesCount",
			"likers: likersCount"
		];
		
		// Set additional queries for relational data.
		if (user.id != relatedUser.id) {
			queries = queries.concat([
				"MATCH (relatedUser:User {id: $relatedUserId}) WITH rudelCount, listsCount, likees, likeesCount, likers, likersCount, user, relatedUser",
				"OPTIONAL MATCH (relatedUser)-[mfes:LIKES_USER]->(u:User) WHERE ANY(l in likees WHERE l.id = u.id) WITH rudelCount, listsCount, likeesCount, likers, likersCount, COUNT(mfes) AS mutualLikeesCount, user, relatedUser",
				"OPTIONAL MATCH (relatedUser)<-[mfrs:LIKES_USER]-(u:User) WHERE ANY(l in likers WHERE l.id = u.id) WITH rudelCount, listsCount, likeesCount, likersCount, mutualLikeesCount, COUNT(mfrs) AS mutualLikersCount, user, relatedUser",
				"OPTIONAL MATCH (user)<-[fu:LIKES_USER]-(relatedUser) WITH rudelCount, listsCount, likeesCount, likersCount, mutualLikeesCount, mutualLikersCount, COUNT(fu) > 0 AS isLikee, user, relatedUser",
				"OPTIONAL MATCH (user)-[fu:LIKES_USER]->(relatedUser) WITH rudelCount, listsCount, likeesCount, likersCount, mutualLikeesCount, mutualLikersCount, isLikee, COUNT(fu) > 0 AS isLiker"
			]);
			
			transformations = transformations.concat([
				"mutualLikees: mutualLikeesCount",
				"mutualLikers: mutualLikersCount",
				"isLiker: isLiker",
				"isLikee: isLikee"
			]);
		}
		
		// Add final query.
		queries.push(`RETURN {${transformations.join(',')}}`);
		
		// Run query.
		return transaction.run(queries.join(' '), {
			userId: user.id,
			relatedUserId: relatedUser.id
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 0).shift());
	}
	
	export function getPublicUser(transaction: Transaction, user: User | User[], relatedUser: User, preview = false): Promise<any | any[]> {
		let createPublicUser = (user: User) => {
			// Gather user information.
			let promises: Promise<UserStatistics | number>[] = [];
			if(!preview) promises.push(UserController.getStatistics(transaction, user, relatedUser));
			if (user.id == relatedUser.id) promises.push(AccountController.NotificationController.countUnread(transaction, user));
			
			// Modify user information.
			return Promise.all(promises).then((values: [UserStatistics, number]) => {
				// Add default links.
				let links: any = {};
				
				// Add avatar links?
				if (user.avatarId) {
					links['avatars'] = {
						small: AccountController.getAvatarLink(user, AccountController.AvatarSizes.small),
						medium: AccountController.getAvatarLink(user, AccountController.AvatarSizes.medium),
						large: AccountController.getAvatarLink(user, AccountController.AvatarSizes.large),
					};
				}
				
				let transformationRecipe = {
					'user.id': 'id',
					'user.username': 'username',
					'user.firstName': 'firstName',
					'user.lastName': 'lastName',
					'hasAvatar': 'hasAvatar',
					'profileText': 'profileText',
					'createdAt': 'createdAt',
					'updatedAt': 'updatedAt',
					'links': 'links'
				};
				
				let transformationObject = {
					user: user,
					profileText: user.profileText || null,
					createdAt: UtilController.isoDate(user.createdAt),
					updatedAt: UtilController.isoDate(user.updatedAt),
					hasAvatar: !!user.avatarId,
					links: links
				};
				
				// Emit extended information.
				if (!preview) {
					// Extend transformation recipe.
					transformationRecipe = Object.assign(transformationRecipe, {
						'statistics.rudel': 'statistics.rudel',
						'statistics.likers': 'statistics.likers',
						'statistics.likees': 'statistics.likees',
						'statistics.lists': 'statistics.lists',
						'statistics.mutualLikers': 'relations.mutualLikers',
						'statistics.mutualLikees': 'relations.mutualLikees',
						'statistics.isLiker': 'relations.isLiker',
						'statistics.isLikee': 'relations.isLikee'
					});
					
					// Extend transformation object.
					transformationObject = Object.assign(transformationObject, {
						statistics: values[0]
					});
				}
				
				// Emit private information.
				if (user.id == relatedUser.id) {
					// Extend transformation recipe.
					transformationRecipe = Object.assign(transformationRecipe, {
						'user.location': 'location',
						'user.onBoard': 'onBoard',
						'user.languages': 'languages',
						'unreadNotifications': 'unreadNotifications',
					});
					
					// Extend transformation object.
					transformationObject = Object.assign(transformationObject, {
						unreadNotifications: values[1]
					});
				}
				
				return dot.transform(transformationRecipe, transformationObject) as any;
			});
		};

		let transformed = user instanceof Array ? Promise.all(user.map(createPublicUser)) : createPublicUser(user);
		return transformed.then((result: any | Array<any>) => result);
	}

    export function likers(transaction: Transaction, user: User, skip: number = 0, limit: number = 0): Promise<User[]> {
	    let query = `MATCH(:User {id: $userId})<-[:LIKES_USER]-(likers:User) RETURN COALESCE(properties(likers), []) AS likers SKIP $skip`;
	    if(limit > 0) query += ' LIMIT $limit';

        return transaction.run(query, {
            userId: user.id,
            skip: skip,
            limit: limit
        }).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'likers'));
    }
	
	export function likees(transaction: Transaction, user: User, skip: number = 0, limit: number = 0): Promise<User[]> {
	    let query = `MATCH(:User {id: $userId})-[:LIKES_USER]->(likees:User) RETURN COALESCE(properties(likees), []) AS likees SKIP $skip`;
        if(limit > 0) query += ' LIMIT $limit';

		return transaction.run(query, {
			userId: user.id,
			skip: skip,
			limit: limit
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'likees'));
	}
	
	export function like(transaction: Transaction, user: User, aimedUser: User): Promise<void> {
		if (aimedUser.id === user.id) return Promise.reject<void>('Users cannot follow themselves.');
		return transaction.run("MATCH(user:User {id: $userId}), (followee:User {id: $followeeUserId}) WHERE NOT (user)-[:LIKES_USER]->(followee) WITH user, followee MERGE (user)-[lu:LIKES_USER]->(followee) ON CREATE SET lu.createdAt = $now WITH user, followee OPTIONAL MATCH (user)-[dlu:DISLIKES_USER]->(followee) DETACH DELETE dlu", {
			userId: user.id,
			followeeUserId: aimedUser.id,
			now: Math.trunc(Date.now() / 1000)
		}).then((result: any) => {
			if(result.summary.counters.relationshipsCreated() > 0) return AccountController.NotificationController.set(transaction, NotificationType.LIKES_USER, [aimedUser], aimedUser, user);
		});
	}
	
	export function dislike(transaction: Transaction, user: User, aimedUser: User): Promise<void> {
		if (aimedUser.id === user.id) return Promise.reject<void>('Users cannot unfollow themselves.');
		return transaction.run("MATCH(user:User {id: $userId}), (followee:User {id: $followeeUserId}) WHERE NOT (user)-[:DISLIKES_USER]->(followee) WITH user, followee MERGE (user)-[du:DISLIKES_USER]->(followee) ON CREATE SET du.createdAt = $now WITH user, followee OPTIONAL MATCH (user)-[lu:LIKES_USER]->(followee) DETACH DELETE lu", {
			userId: user.id,
			followeeUserId: aimedUser.id,
			now: Math.trunc(Date.now() / 1000)
		}).then(() => {});
	}

    export function suggested(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<User[]> {
        return transaction.run('MATCH (u1:User {id: $userId})-[:LIKES_RUDEL]->(intersection:Rudel)<-[:LIKES_RUDEL]-(u2:User) WHERE u2 <> u1 AND NOT (u1)-[:LIKES_USER|:DISLIKES_USER]->(u2) WITH u1, COUNT(DISTINCT intersection) AS intersection, u2 MATCH (rudel_u1:Rudel)<-[:LIKES_RUDEL]-(u1), (u2)-[:LIKES_RUDEL]->(rudel_u2:Rudel) WITH COLLECT(DISTINCT rudel_u1) AS rudel_u1, u1, intersection, u2, COLLECT(DISTINCT rudel_u2) AS rudel_u2 WITH u1, length(rudel_u1 + filter(x IN rudel_u2 WHERE NOT x IN rudel_u1)) AS union, intersection, u2 WITH toFloat(intersection) / union AS similarity, u2 ORDER BY similarity DESC SKIP $skip LIMIT $limit RETURN properties(u2) AS u', {
            userId: user.id,
            skip: skip,
            limit: limit
        }).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'u'));
    }

    export function recent(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<User[]> {
        return transaction.run('MATCH(ru:User), (u:User {id: $userId}) WHERE NOT ru = u AND NOT (ru)<-[:DISLIKES_USER]-(u) WITH ru ORDER BY ru.createdAt DESC SKIP $skip LIMIT $limit RETURN properties(ru) AS u', {
            userId: user.id,
            skip: skip,
            limit: limit
        }).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'u'));
    }

	export namespace RouteHandlers {
		
		/**
		 * Handles [GET] /api/users/=/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param reply Reply-Object
		 */
		export function getUser(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<User> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then((user: User) => {
				if (!user) return Promise.reject(Boom.notFound('User not found!'));
				return UserController.getPublicUser(transaction, user, request.auth.credentials);
			});
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/users/search/{query}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function search(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<User[]> = UserController.findByFulltext(transaction, request.params.query, request.query.offset, request.query.limit).then((users: User[]) => {
				return UserController.getPublicUser(transaction, users, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/users/=/{username}/likers
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function likers(request: any, reply: any): void {
			// Create user promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<User> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then((user: User) => {
				if (!user) return Promise.reject(Boom.notFound('User not found!'));
				return UserController.likers(transaction, user, request.query.offset, request.query.limit);
			}).then((users: User[]) => UserController.getPublicUser(transaction, users, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/users/=/{username}/likees
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function likees(request: any, reply: any): void {
			// Create user promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<User> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then((user: User) => {
				if (!user) return Promise.reject(Boom.badRequest('User does not exist!'));
				return UserController.likees(transaction, user, request.query.offset, request.query.limit);
			}).then((users: User[]) => UserController.getPublicUser(transaction, users, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/users/like/{user}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.user user
		 * @param reply Reply-Object
		 */
		export function like(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = UserController.findByUsername(transaction, request.params.user).then((user: User) => {
				if (!user) return Promise.reject(Boom.notFound('User not found!'));
				return UserController.like(transaction, request.auth.credentials, user).then(() => {
					return UserController.getPublicUser(transaction, user, request.auth.credentials);
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/users/dislike/{user}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.user user
		 * @param reply Reply-Object
		 */
		export function dislike(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = findByUsername(transaction, request.params.user).then((user: User) => {
				if (!user) return Promise.reject(Boom.notFound('User not found!'));
				return UserController.dislike(transaction, request.auth.credentials, user).then(() => {
					return UserController.getPublicUser(transaction, user, request.auth.credentials);
				});
			});
			
			reply.api(promise, transactionSession);
		}

        /**
         * Handles [GET] /api/users/recent
         * @param request Request-Object
         * @param request.query.offset offset (optional, default=0)
         * @param request.query.limit limit (optional, default=25)
         * @param request.auth.credentials
         * @param reply Reply-Object
         */
        export function recent(request: any, reply: any): void {
            // Create promise.
            let transactionSession = new TransactionSession();
            let transaction = transactionSession.beginTransaction();
            let promise: Promise<any> = UserController.recent(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((user: User[]) => {
                return UserController.getPublicUser(transaction, user, request.auth.credentials);
            });

            reply.api(promise, transactionSession);
        }

        /**
         * Handles [GET] /api/users/suggested
         * @param request Request-Object
         * @param request.query.offset offset (optional, default=0)
         * @param request.query.limit limit (optional, default=25)
         * @param request.auth.credentials
         * @param reply Reply-Object
         */
        export function suggested(request: any, reply: any): void {
            // Create promise.
            let transactionSession = new TransactionSession();
            let transaction = transactionSession.beginTransaction();
            let promise: Promise<any> = UserController.suggested(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((user: User[]) => {
                return UserController.getPublicUser(transaction, user, request.auth.credentials);
            });

            reply.api(promise, transactionSession);
        }
	}
}
