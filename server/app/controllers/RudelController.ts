import * as Boom from 'boom';
import * as dot from 'dot-object';
import {DatabaseManager, TransactionSession} from '../Database';
import {Rudel} from '../models/rudel/Rudel';
import {User} from '../models/user/User';
import {UserController} from './UserController';
import {Translations} from '../models/Translations';
import {UtilController} from './UtilController';
import {ExpeditionController} from './ExpeditionController';
import Transaction from 'neo4j-driver/lib/v1/transaction';
import * as shortid from 'shortid';

export module RudelController {
	
	export function create(transaction: Transaction, recipe: {
		translations: Translations,
		icon: string
	}): Promise<Rudel> {
		let rudel: Rudel = {
			id: shortid.generate(),
			icon: recipe.icon,
			translations: recipe.translations,
			defaultLocation: null,
			createdAt: null,
			updatedAt: null
		};
		return RudelController.save(transaction, rudel).then(() => rudel);
	}
	
	export function save(transaction: Transaction, rudel: Rudel): Promise<void> {
		// Set timestamps.
		let now = new Date().toISOString();
		if (!rudel.createdAt) rudel.createdAt = now;
		rudel.updatedAt = now;
		
		// Save.
		return transaction.run("MERGE (r:Rudel {id: $rudel.id}) ON CREATE SET r = $flattenRudel ON MATCH SET r = $flattenRudel", {
			rudel: rudel,
			flattenRudel: DatabaseManager.neo4jFunctions.flatten(rudel)
		}).then(() => {});
	}
	
	export function remove(transaction: Transaction, rudel: Rudel): Promise<any> {
		return ExpeditionController.removeExpeditions(transaction, rudel).then(() => {
			return transaction.run("MATCH(r:Rudel {id: $rudelId}) DETACH DELETE r", {
				rudelId: rudel.id
			}).then(() => {});
		});
	}
	
	export function getPublicRudel(transaction: Transaction, rudel: Rudel | Rudel[], relatedUser: User): Promise<any | any[]> {
		let createPublicRudel = (rudel: Rudel): Promise<any> => {
			let rudelOwnerPromise = RudelController.getOwner(transaction, rudel);
			let publicRudelOwnerPromise = rudelOwnerPromise.then((owner: User) => {
				return UserController.getPublicUser(transaction, owner, relatedUser);
			});
			let rudelStatisticsPromise = RudelController.getStatistics(transaction, rudel, relatedUser);
			
			return Promise.all([
				rudelOwnerPromise,
				publicRudelOwnerPromise,
				rudelStatisticsPromise
			]).then((values: [User, any, RudelStatistics]) => {
				// Add default links.
				let links = {
					icon: UtilController.getIconUrl(rudel.icon)
				};
				
				// Build profile.
				return Promise.resolve(dot.transform({
					'rudel.id': 'id',
					'rudel.translations': 'translations',
					'rudel.icon': 'icon',
					'defaultLocation': 'defaultLocation',
					'owner': 'owner',
					'links': 'links',
					'rudel.createdAt': 'createdAt',
					'rudel.updatedAt': 'updatedAt',
					'isOwner': 'relations.isOwned',
					'statistics.isFollowed': 'relations.isFollowed',
					'statistics.rudel': 'statistics.rudel',
					'statistics.followers': 'statistics.followers',
					'statistics.lists': 'statistics.lists',
					'statistics.expeditions': 'statistics.expeditions'
				}, {
					rudel: rudel,
					defaultLocation: rudel.defaultLocation || relatedUser.location,
					links: links,
					statistics: values[2],
					owner: values[1],
					isOwner: values[0].id == relatedUser.id
				}));
			});
		};
		
		let now = Date.now();
		let transformed = rudel instanceof Array ? Promise.all(rudel.map(createPublicRudel)) : createPublicRudel(rudel);
		return transformed.then((result: any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' rudel' : '1 rudel'} took ${Date.now() - now} millis`);
			return result;
		});
	}
	
	export function findByUser(transaction: Transaction, user: User, ownsOnly = false, skip = 0, limit = 25): Promise<Rudel[]> {
		return transaction.run<Rudel, any>(`MATCH(:User {id : $userId })-[:${ownsOnly ? 'OWNS_RUDEL' : 'FOLLOWS_RUDEL'}]->(r:Rudel) RETURN COALESCE(properties(r), []) as r SKIP $skip LIMIT $limit`, {
			userId: user.id,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'r'));
	}
	
	export function get(transaction: Transaction, rudelId: string): Promise<Rudel> {
		return transaction.run("MATCH(r:Rudel {id: $rudelId}) RETURN COALESCE(properties(r), []) as r LIMIT 1", {
			rudelId: rudelId
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'r').pop());
	}
	
	export function findByFulltext(transaction: Transaction, query: string, skip = 0, limit = 25): Promise<Rudel[]> {
		return transaction.run<User, any>('CALL apoc.index.search("Rudel", $query) YIELD node WITH properties(node) as r RETURN r SKIP $skip LIMIT $limit', {
			query: `${query}~`,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'r'));
	}
	
	export interface RudelStatistics {
		lists: number;
		followers: number;
		expeditions: number;
		isFollowed: boolean;
	}
	
	export function getStatistics(transaction: Transaction, rudel: Rudel, relatedUser: User): Promise<RudelStatistics> {
		let queries: string[] = [
			"MATCH (rudel:Rudel {id: $rudelId})",
			"OPTIONAL MATCH (rudel)<-[fr:FOLLOWS_RUDEL]-() WITH COUNT(fr) as followersCount, rudel",
			"OPTIONAL MATCH (rudel)-[btl:BELONGS_TO_LIST]->() WITH COUNT(btl) as listsCount, followersCount, rudel",
			"OPTIONAL MATCH (rudel)<-[btr:BELONGS_TO_RUDEL]-() WITH COUNT(btr) as expeditionsCount, followersCount, rudel, listsCount",
			"OPTIONAL MATCH (rudel)<-[fr:FOLLOWS_RUDEL]-(:User {id: $relatedUserId}) WITH followersCount, listsCount, COUNT(fr) > 0 as isFollowed, expeditionsCount"
		];
		
		let transformations: string[] = [
			"lists: listsCount",
			"isFollowed: isFollowed",
			"followers: followersCount",
			"expeditions: expeditionsCount"
		];
		
		// Add final query.
		queries.push(`RETURN {${transformations.join(',')}}`);
		
		// Run query.
		return transaction.run<any, any>(queries.join(' '), {
			rudelId: rudel.id,
			relatedUserId: relatedUser.id
		}).then(result => DatabaseManager.neo4jFunctions.unflatten(result.records, 0).pop());
	}
	
	export function getOwner(transaction: Transaction, rudel: Rudel): Promise<User> {
		return transaction.run<User, any>(`MATCH(:Rudel {id: $rudelId})<-[:OWNS_RUDEL]-(owner:User) RETURN COALESCE(properties(owner), []) as owner LIMIT 1`, {
			rudelId: rudel.id
		}).then(result => DatabaseManager.neo4jFunctions.unflatten(result.records, 'owner').pop());
	}
	
	export function follow(transaction: Transaction, rudel: Rudel, user: User): Promise<void> {
		// Set FOLLOWS_RUDEL.
		transaction.run("MATCH(u:User {id: $userId}), (r:Rudel {id: $rudelId}) MERGE (u)-[:FOLLOWS_RUDEL {createdAt: $now}]->(r)", {
			userId: user.id,
			rudelId: rudel.id,
			now: new Date().toISOString()
		}).then(() => {});
		
		// Set OWNS_RUDEL optionally.
		return transaction.run("MATCH(r:Rudel {id: $rudelId}), (u:User {id: $userId}) OPTIONAL MATCH (r)<-[or:OWNS_RUDEL]-(:User) WITH COUNT(or) as count, r, u WHERE count = 0 CREATE (r)<-[:OWNS_RUDEL {createdAt: $now}]-(u)", {
			userId: user.id,
			rudelId: rudel.id,
			now: new Date().toISOString()
		}).then(() => {});
	}
	
	export function unfollow(transaction: Transaction, rudel: Rudel, user: User): Promise<void> {
		transaction.run("MATCH(:User {id: $userId})-[fror:FOLLOWS_RUDEL:OWNS_RUDEL]->(:Rudel {id: $rudelId}) DETACH DELETE fror", {
			userId: user.id,
			rudelId: rudel.id
		}).then(() => {});
		
		// Delete, if orphan node.
		return transaction.run("MATCH(l:Rudel {id: $rudelId}) OPTIONAL MATCH (r)<-[or:OWNS_RUDEL]-(:User) WITH COUNT(or) as count, r WHERE count = 0 DETACH DELETE r", {
			rudelId: rudel.id
		}).then(() => {});
	}
	
	export function followers(transaction: Transaction, rudel: Rudel, skip = 0, limit = 25): Promise<User[]> {
		return transaction.run<User, any>(`MATCH(:Rudel {id: $rudelId})<-[:FOLLOWS_RUDEL]-(followers:User) RETURN COALESCE(properties(followers), []) as followers SKIP $skip LIMIT $limit`, {
			rudelId: rudel.id,
			skip: skip,
			limit: limit
		}).then(result => DatabaseManager.neo4jFunctions.unflatten(result.records, 'followers'));
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
				return RudelController.follow(transaction, rudel, request.auth.credentials).then(() => {
					return RudelController.getPublicRudel(transaction, rudel, request.auth.credentials);
				});
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
			let promise: Promise<Rudel> = RudelController.get(transaction, request.params.id).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.notFound('Rudel not found.'));
				return RudelController.getPublicRudel(transaction, rudel, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/rudel/like/{query}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function like(request: any, reply: any): void {
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
		 * Handles [POST] /api/rudel/follow/{id}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.id id
		 * @param reply Reply-Object
		 */
		export function follow(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = RudelController.get(transaction, request.params.id).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.notFound('Rudel not found!'));
				return RudelController.follow(transaction, rudel, request.auth.credentials).then(() => {
					return RudelController.getPublicRudel(transaction, rudel, request.auth.credentials);
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/rudel/unfollow/{id}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.id id
		 * @param reply Reply-Object
		 */
		export function unfollow(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = RudelController.get(transaction, request.params.id).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.notFound('Rudel not found!'));
				return RudelController.unfollow(transaction, rudel, request.auth.credentials).then(() => {
					return RudelController.get(transaction, rudel.id).then(rudel => {
						return rudel ? RudelController.getPublicRudel(transaction, rudel, request.auth.credentials) : null;
					});
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/rudel/=/{id}/followers
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function followers(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.id).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.badRequest('Rudel does not exist!'));
				return RudelController.followers(transaction, rudel, request.query.offset, request.query.limit);
			}).then((users: User[]) => UserController.getPublicUser(transaction, users, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
	}
}
