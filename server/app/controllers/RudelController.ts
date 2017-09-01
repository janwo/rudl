import * as Boom from 'boom';
import * as dot from 'dot-object';
import {DatabaseManager, TransactionSession} from '../DatabaseManager';
import {Rudel} from '../models/rudel/Rudel';
import {User} from '../models/user/User';
import {UserController} from './UserController';
import {Translations} from '../models/Translations';
import {UtilController} from './UtilController';
import {ExpeditionController} from './ExpeditionController';
import Transaction from 'neo4j-driver/types/v1/transaction';
import {StatementResult} from 'neo4j-driver/types/v1/result';
import * as shortid from 'shortid';
import {AccountController} from './AccountController';
import {NotificationType} from "../models/notification/Notification";

export const LOCATION_RADIUS_METERS = 30000;

export module RudelController {

    export function create(transaction: Transaction, recipe: {
		translations: Translations,
		icon: string
	}): Promise<Rudel> {
		let rudel: Rudel = {
			id: shortid.generate(),
			icon: recipe.icon,
			translations: recipe.translations
		};
		return RudelController.save(transaction, rudel).then(() => rudel);
	}
	
	export function save(transaction: Transaction, rudel: Rudel): Promise<void> {
		// Set timestamps.
		let now = Math.trunc(Date.now() / 1000);
		if (!rudel.createdAt) rudel.createdAt = now;
		rudel.updatedAt = now;
		
		// Save.
		return transaction.run("MERGE (r:Rudel {id: $rudel.id}) ON CREATE SET r = $flattenRudel ON MATCH SET r = $flattenRudel", {
			rudel: rudel,
			flattenRudel: DatabaseManager.neo4jFunctions.flatten(rudel)
		}).then(() => {});
	}
	
	export function getPublicRudel(transaction: Transaction, rudel: Rudel | Rudel[], relatedUser: User, preview = false): Promise<any | any[]> {
		let createPublicRudel = (rudel: Rudel): Promise<any> => {
			// Gather expedition information.
			let promise = ((): Promise<[User, any, RudelStatistics]> => {
				if (!preview) {
					let rudelOwnerPromise = RudelController.getOwner(transaction, rudel);
					let publicRudelOwnerPromise = rudelOwnerPromise.then((owner: User) => {
						return UserController.getPublicUser(transaction, owner, relatedUser, true);
					});
					let rudelStatisticsPromise = RudelController.getStatistics(transaction, rudel, relatedUser);
					return Promise.all([
						rudelOwnerPromise,
						publicRudelOwnerPromise,
						rudelStatisticsPromise
					]);
				}
				return Promise.resolve([]) as Promise<[User, any, RudelStatistics]>;
			})();
			
			// Modify rudel information.
			return promise.then(values => {
				// Add default links.
				let links = {
					icon: UtilController.getIconUrl(rudel.icon)
				};
				
				let transformationRecipe = {
					'rudel.id': 'id',
					'rudel.translations': 'translations',
					'rudel.icon': 'icon',
					'createdAt': 'createdAt',
					'updatedAt': 'updatedAt',
					'links': 'links'
				};
				
				let transformationObject = {
					rudel: rudel,
					createdAt: UtilController.isoDate(rudel.createdAt),
					updatedAt: UtilController.isoDate(rudel.updatedAt),
					links: links
				};
				
				// Emit extended information.
				if(!preview) {
					// Extend transformation recipe.
					transformationRecipe = Object.assign(transformationRecipe, {
						'owner': 'owner',
						'isOwner': 'relations.isOwned',
						'statistics.isLiked': 'relations.isLiked',
						'statistics.rudel': 'statistics.rudel',
						'statistics.likers': 'statistics.likers',
						'statistics.lists': 'statistics.lists',
						'statistics.expeditions': 'statistics.expeditions'
					});
					
					// Extend transformation object.
					transformationObject = Object.assign(transformationObject, {
						statistics: values[2],
						owner: values[1],
						isOwner: values[0].id == relatedUser.id
					});
				}
				
				// Build profile.
				return dot.transform(transformationRecipe, transformationObject);
			});
		};

		let transformed = rudel instanceof Array ? Promise.all(rudel.map(createPublicRudel)) : createPublicRudel(rudel);
		return transformed.then((result: any | Array<any>) => result);
	}
	
	export function findByUser(transaction: Transaction, user: User, ownsOnly = false, skip = 0, limit = 25): Promise<Rudel[]> {
		return transaction.run(`MATCH(:User {id : $userId })-[:${ownsOnly ? 'OWNS_RUDEL' : 'LIKES_RUDEL'}]->(r:Rudel) RETURN COALESCE(properties(r), []) as r SKIP $skip LIMIT $limit`, {
			userId: user.id,
			skip: skip,
			limit: limit
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'r'));
	}
	
	export function get(transaction: Transaction, rudelId: string): Promise<Rudel> {
		return transaction.run("MATCH(r:Rudel {id: $rudelId}) RETURN COALESCE(properties(r), []) as r LIMIT 1", {
			rudelId: rudelId
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'r').shift());
	}
	
	export function findByFulltext(transaction: Transaction, query: string, skip = 0, limit = 25): Promise<Rudel[]> {
		return transaction.run('CALL apoc.index.search("Rudel", $query) YIELD node WITH properties(node) as r RETURN r SKIP $skip LIMIT $limit', {
			query: `${DatabaseManager.neo4jFunctions.escapeLucene(query)}~`,
			skip: skip,
			limit: limit
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'r'));
	}
	
	export interface RudelStatistics {
		lists: number;
		likers: number;
		expeditions: number;
		isLiked: boolean;
	}
	
	export function getStatistics(transaction: Transaction, rudel: Rudel, relatedUser: User): Promise<RudelStatistics> {
		let queries: string[] = [
			"MATCH (rudel:Rudel {id: $rudelId})",
			"OPTIONAL MATCH (rudel)<-[fr:LIKES_RUDEL]-() WITH COUNT(fr) as likersCount, rudel",
			"OPTIONAL MATCH (rudel)-[btl:BELONGS_TO_LIST]->() WITH COUNT(btl) as listsCount, likersCount, rudel",
			"OPTIONAL MATCH (rudel)<-[btr:BELONGS_TO_RUDEL]-() WITH COUNT(btr) as expeditionsCount, likersCount, rudel, listsCount",
			"OPTIONAL MATCH (rudel)<-[fr:LIKES_RUDEL]-(:User {id: $relatedUserId}) WITH likersCount, listsCount, COUNT(fr) > 0 as isLiked, expeditionsCount"
		];
		
		let transformations: string[] = [
			"lists: listsCount",
			"isLiked: isLiked",
			"likers: likersCount",
			"expeditions: expeditionsCount"
		];
		
		// Add final query.
		queries.push(`RETURN {${transformations.join(',')}}`);
		
		// Run query.
		return transaction.run(queries.join(' '), {
			rudelId: rudel.id,
			relatedUserId: relatedUser.id
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 0).shift());
	}
	
	export function getOwner(transaction: Transaction, rudel: Rudel): Promise<User> {
		return transaction.run(`MATCH(:Rudel {id: $rudelId})<-[:OWNS_RUDEL]-(owner:User) RETURN COALESCE(properties(owner), []) as owner LIMIT 1`, {
			rudelId: rudel.id
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'owner').shift());
	}

	export function like(transaction: Transaction, rudel: Rudel, user: User): Promise<void> {
		return transaction.run("MATCH(u:User {id: $userId}), (r:Rudel {id: $rudelId}) WHERE NOT (u)-[:LIKES_RUDEL]->(r) WITH u, r CREATE UNIQUE (u)-[:LIKES_RUDEL {createdAt: $now}]->(r) WITH u, r OPTIONAL MATCH (u)-[dlr:DISLIKES_RUDEL]->(r) DETACH DELETE dlr WITH u, r OPTIONAL MATCH (r)<-[or:OWNS_RUDEL]-(:User) WITH COUNT(or) as count, r, u WHERE count = 0 CREATE UNIQUE (r)<-[:OWNS_RUDEL {createdAt: $now}]-(u)", {
			userId: user.id,
			rudelId: rudel.id,
			now: new Date().getTime() / 1000
		}).then(() => {});
	}

    export function locations(transaction: Transaction, rudel: Rudel, user: User): Promise<{
		latitude: number,
		longitude: number
	}[]> {
        return transaction.run(`CALL spatial.closest("Expedition", $location, ${LOCATION_RADIUS_METERS / 1000}) YIELD node as e WHERE (e)-[:BELONGS_TO_RUDEL]->(:Rudel {id: $rudelId}) AND e.needsApproval = false RETURN {latitude: e.location_latitude, longitude: e.location_longitude} as l LIMIT 10`, {
            location: user.location,
            rudelId: rudel.id
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'l'));
    }

    export function dislike(transaction: Transaction, rudel: Rudel, user: User): Promise<void> {
        let deleteExpeditions = ExpeditionController.removeExpeditions(transaction, rudel, user);
        let deleteRelationships = transaction.run("MATCH(u:User {id: $userId}), (r:Rudel {id: $rudelId}) WHERE NOT (u)-[:DISLIKES_RUDEL]->(r) WITH u, r CREATE UNIQUE (u)-[:DISLIKES_RUDEL {createdAt: $now}]->(r) WITH u, r OPTIONAL MATCH (u)-[or:OWNS_RUDEL]->(r) OPTIONAL MATCH (u)-[fr:LIKES_RUDEL]->(r) DETACH DELETE fr, or", {
            userId: user.id,
            rudelId: rudel.id,
            now: new Date().getTime() / 1000
        });

        return Promise.all([
            deleteExpeditions,
            deleteRelationships
        ]).then(() => {
            return this.likers(transaction, rudel, 0, 1).then((likers: User[]) => {
                if(likers.length > 0) return transaction.run("MATCH(r:Rudel {id: $rudelId}), (u:User {id: $newOwnerId}) WITH u, r OPTIONAL MATCH (r)<-[or:OWNS_RUDEL]-(:User) WITH COUNT(or) as count, r, u WHERE count = 0 CREATE (r)<-[:OWNS_RUDEL {createdAt: $now}]-(u)", {
                    rudelId: rudel.id,
                    now: new Date().getTime() / 1000,
                    newOwnerId: likers.shift().id
                });

                // Delete rudel, because it's an orphan node.
                return ExpeditionController.removeExpeditions(transaction, rudel).then(() => {
                    return transaction.run("MATCH(r:Rudel {id: $rudelId}) CALL apoc.index.removeNodeByName('Rudel', r) DETACH DELETE r", {
                        rudelId: rudel.id
                    }).then(() => AccountController.NotificationController.removeDetachedNotifications(transaction));
                });
            }).then(() => {});
        });
    }

    export function likers(transaction: Transaction, rudel: Rudel, skip = 0, limit = 0): Promise<User[]> {
        let query = `MATCH(:Rudel {id: $rudelId})<-[:LIKES_RUDEL]-(likers:User) RETURN COALESCE(properties(likers), []) as likers SKIP $skip`;
        if(limit > 0) query += ' LIMIT $limit';

        return transaction.run(query, {
            rudelId: rudel.id,
            skip: skip,
            limit: limit
        }).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'likers'));
    }

    export function suggested(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Rudel[]> {
        return transaction.run('MATCH (r:Rudel)<-[:LIKES_RUDEL]-(u1:User {id: $userId}) WITH COUNT(r) as userLikes, u1 MATCH (u2:User)-[:LIKES_RUDEL]->(r:Rudel)<-[:LIKES_RUDEL]-(u1) WHERE NOT u2 = u1 WITH u1, u2, toFloat(COUNT(DISTINCT r)) / userLikes as similarity WHERE similarity > 0.3 MATCH (r:Rudel)<-[:LIKES_RUDEL]-(u2) WHERE NOT (r)<-[:LIKES_RUDEL]-(u1) AND NOT (r)<-[:DISLIKES_RUDEL]-(u1) WITH DISTINCT r SKIP $skip LIMIT $limit RETURN properties(r) as r', {
            userId: user.id,
            skip: skip,
            limit: limit
        }).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'r'));
    }
	
	export function popular(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Rudel[]> {
		return transaction.run('MATCH(r:Rudel), (u:User {id: $userId}) WHERE NOT (r)<-[:DISLIKES_RUDEL]-(u) WITH r, size((r)<-[:LIKES_RUDEL]-()) as popularity ORDER BY popularity DESC SKIP $skip LIMIT $limit RETURN properties(r) as r', {
			userId: user.id,
			skip: skip,
			limit: limit
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'r'));
	}
	
	export function recent(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Rudel[]> {
		return transaction.run('MATCH(r:Rudel), (u:User {id: $userId}) WHERE NOT (r)<-[:DISLIKES_RUDEL]-(u) WITH r ORDER BY r.createdAt DESC SKIP $skip LIMIT $limit RETURN properties(r) as r', {
			userId: user.id,
			skip: skip,
			limit: limit
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'r'));
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [POST] /api/rudel/create
		 * @param request Request-Object
		 * @param request.payload.translations translations
		 * @param request.payload.icon icon
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function create(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.create(transaction, {
				translations: request.payload.translations,
				icon: request.payload.icon
			}).then(rudel => {
				return Promise.all([
				    RudelController.like(transaction, rudel, request.auth.credentials),
                    UserController.likers(transaction, request.auth.credentials).then(likers => {
                        return AccountController.NotificationController.set(transaction, NotificationType.ADDED_RUDEL, likers, rudel, request.auth.credentials);
                    })
                ]).then(() => RudelController.getPublicRudel(transaction, rudel, request.auth.credentials));
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/rudel/=/{id}/update
		 * @param request Request-Object
		 * @param request.params.id rudel
		 * @param request.payload.translations translations
		 * @param request.payload.icon icon
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function update(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.id).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.badRequest('Rudel does not exist!'));
				
				return RudelController.getOwner(transaction, rudel).then(owner => {
					if (owner.id != request.auth.credentials.id) return Promise.reject(Boom.forbidden('You do not have enough privileges to perform this operation.'));
					
					// Update rudel.
					if (request.payload.icon) rudel.icon = request.payload.icon;
					if (request.payload.translations) rudel.translations = request.payload.translations;
					return RudelController.save(transaction, rudel);
				}).then(() => RudelController.getPublicRudel(transaction, rudel, request.auth.credentials));
			});
			
			reply.api(promise, transactionSession);
		}

		/**
		 * Handles [GET] /api/rudel/=/{id}
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function get(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.id).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.notFound('Rudel not found.'));
				return RudelController.getPublicRudel(transaction, rudel, request.auth.credentials);
			});

			reply.api(promise, transactionSession);
		}

		/**
		 * Handles [GET] /api/rudel/=/{id}/nearby-locations
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function locations(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.id).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.notFound('Rudel not found.'));
				return RudelController.locations(transaction, rudel, request.auth.credentials).then(locations => {
					return locations;
				});
			});

			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/rudel/search/{query}
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
			let promise: Promise<any> = RudelController.findByFulltext(transaction, request.params.query, request.query.offset, request.query.limit).then((rudel: Rudel[]) => {
				return RudelController.getPublicRudel(transaction, rudel, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/rudel/by/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function by(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then(user => {
				if (!user) return Promise.reject(Boom.notFound('User not found!'));
				return RudelController.findByUser(transaction, user, false, request.query.offset, request.query.limit);
			}).then((rudel: Rudel[]) => getPublicRudel(transaction, rudel, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/rudel/like/{id}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.id id
		 * @param reply Reply-Object
		 */
		export function like(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.id).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.notFound('Rudel not found!'));
				return Promise.all([
				    RudelController.like(transaction, rudel, request.auth.credentials),
                    UserController.likers(transaction, request.auth.credentials).then(likers => {
                        return AccountController.NotificationController.set(transaction, NotificationType.LIKES_RUDEL, likers, rudel, request.auth.credentials)
                    })
                ]).then(() => RudelController.getPublicRudel(transaction, rudel, request.auth.credentials));
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/rudel/dislike/{id}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.id id
		 * @param reply Reply-Object
		 */
		export function dislike(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.id).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.notFound('Rudel not found!'));
				return RudelController.dislike(transaction, rudel, request.auth.credentials).then(() => {
					return RudelController.get(transaction, rudel.id).then(rudel => {
						return rudel ? RudelController.getPublicRudel(transaction, rudel, request.auth.credentials) : null;
					});
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/rudel/=/{id}/likers
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function likers(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.id).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.badRequest('Rudel does not exist!'));
				return RudelController.likers(transaction, rudel, request.query.offset, request.query.limit);
			}).then((users: User[]) => UserController.getPublicUser(transaction, users, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/rudel/popular
		 * @param request Request-Object
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function popular(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.popular(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((rudel: Rudel[]) => {
				return RudelController.getPublicRudel(transaction, rudel, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/rudel/recent
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
			let promise: Promise<any> = RudelController.recent(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((rudel: Rudel[]) => {
				return RudelController.getPublicRudel(transaction, rudel, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/rudel/suggested
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
			let promise: Promise<any> = RudelController.suggested(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((rudel: Rudel[]) => {
				return RudelController.getPublicRudel(transaction, rudel, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
	}
}
