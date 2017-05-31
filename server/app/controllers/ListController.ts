import * as Boom from 'boom';
import * as dot from 'dot-object';
import {User} from '../models/user/User';
import {DatabaseManager, TransactionSession} from '../Database';
import {List} from '../models/list/List';
import {UserController} from './UserController';
import * as shortid from 'shortid';
import {Rudel} from '../models/rudel/Rudel';
import {ListRecipe} from '../../../client/app/models/list';
import Transaction from 'neo4j-driver/lib/v1/transaction';
import {RudelController} from './RudelController';

export module ListController {
	
	export function getPublicList(transaction: Transaction, list: List | List[], relatedUser: User): Promise<any | any[]> {
		let createPublicList = (list: List): Promise<any> => {
			let listOwnerPromise = ListController.getOwner(transaction, list);
			let publicListOwnerPromise = listOwnerPromise.then((owner: User) => UserController.getPublicUser(transaction, owner, relatedUser));
			let listStatisticsPromise = ListController.getStatistics(transaction, list, relatedUser);
			
			return Promise.all([
				listOwnerPromise,
				publicListOwnerPromise,
				listStatisticsPromise
			]).then((values: [User, any, ListStatistics]) => {
				// Add default links.
				let links = {};
				
				// Build profile.
				return dot.transform({
					'list.id': 'id',
					'list.translations': 'translations',
					'owner': 'owner',
					'links': 'links',
					'isOwner': 'relations.isOwned',
					'list.updatedAt': 'updatedAt',
					'list.createdAt': 'createdAt',
					'statistics.isFollowed': 'relations.isFollowed',
					'statistics.rudel': 'statistics.rudel',
					'statistics.followers': 'statistics.followers'
				}, {
					list: list,
					statistics: values[2],
					links: links,
					owner: values[1],
					isOwner: values[0].id == relatedUser.id
				});
			});
		};
		
		let now = Date.now();
		let transformed = list instanceof Array ? Promise.all(list.map(createPublicList)) : createPublicList(list);
		return transformed.then((result: any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' lists' : '1 list'} took ${Date.now() - now} millis`);
			return result;
		});
	}
	
	export interface ListStatistics {
		rudel: number;
		followers: number;
		isFollowed: boolean;
	}
	
	export function getStatistics(transaction: Transaction, list: List, relatedUser: User): Promise<ListStatistics> {
		let queries: string[] = [
			"MATCH (list:List {id: $listId})",
			"OPTIONAL MATCH (list)<-[fl:FOLLOWS_LIST]-() WITH COUNT(fl) as followersCount, list",
			"OPTIONAL MATCH (list)<-[btl:BELONGS_TO_LIST]-() WITH COUNT(btl) as rudelCount, followersCount",
			"OPTIONAL MATCH (list)<-[fl:FOLLOWS_LIST]-(:User {id: $relatedUserId}) WITH followersCount, rudelCount, COUNT(fl) > 0 as isFollowed"
		];
		
		let transformations: string[] = [
			"rudel: rudelCount",
			"isFollowed: isFollowed",
			"followers: followersCount"
		];
		
		// Add final query.
		queries.push(`RETURN {${transformations.join(',')}}`);
		
		// Run query.
		return transaction.run<any, any>(queries.join(' '), {
			listId: list.id,
			relatedUserId: relatedUser.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 0).pop());
	}
	
	export function findByUser(transaction: Transaction, user: User, ownsOnly = false, skip = 0, limit = 25): Promise<List[]> {
		return transaction.run<List, any>(`MATCH(:User {id: $userId})-[:${ownsOnly ? 'OWNS_LIST' : 'FOLLOWS_LIST'}]->(l:List) RETURN COALESCE(properties(l), []) as l SKIP $skip LIMIT $limit`, {
			userId: user.id,
			limit: limit,
			skip: skip
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'l'));
	}
	
	export function create(transaction: Transaction, recipe: ListRecipe): Promise<List> {
		let list: List = {
			id: shortid.generate(),
			createdAt: null,
			updatedAt: null,
			translations: recipe.translations
		};
		return ListController.save(transaction, list).then(() => list);
	}
	
	export function save(transaction: Transaction, list: List): Promise<void> {
		// Set timestamps.
		let now = new Date().toISOString();
		if (!list.createdAt) list.createdAt = now;
		list.updatedAt = now;
		
		// Save.
		return transaction.run("MERGE (l:List {id: $list.id}) ON CREATE SET l = $flattenList ON MATCH SET l = $flattenList", {
			list: list,
			flattenList: DatabaseManager.neo4jFunctions.flatten(list)
		}).then(() => {});
	}
	
	export function getOwner(transaction: Transaction, list: List): Promise<User> {
		return transaction.run<User, any>(`MATCH(:List {id: $listId})<-[:OWNS_LIST]-(owner:User) RETURN COALESCE(properties(owner), []) as owner LIMIT 1`, {
			listId: list.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'owner').pop());
	}
	
	export function get(transaction: Transaction, listId: string): Promise<List> {
		return transaction.run<List, any>(`MATCH(l:List {id: $listId}) RETURN COALESCE(properties(l), []) as l LIMIT 1`, {
			listId: listId
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'l').pop());
	}
	
	export function findByFulltext(transaction: Transaction, query: string, skip = 0, limit = 25): Promise<List[]> {
		return transaction.run<User, any>('CALL apoc.index.search("List", $query) YIELD node WITH properties(node) as l RETURN l SKIP $skip LIMIT $limit', {
			query: `${DatabaseManager.neo4jFunctions.escapeLucene(query)}~`,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'l'));
	}
	
	export function getRudel(transaction: Transaction, list: List, skip = 0, limit = 25): Promise<Rudel[]> {
		return transaction.run<Rudel, any>("MATCH(:List {id : $listId })-[:BELONGS_TO_LIST]->(r:Rudel) RETURN COALESCE(properties(r), []) as r SKIP $skip LIMIT $limit", {
			listId: list.id,
			limit: limit,
			skip: skip
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'r'));
	}
	
	export function addRudel(transaction: Transaction, list: List, rudel: Rudel): Promise<void> {
		return transaction.run("MATCH(l:List {id : $listId }), (r:Rudel {id: $rudelId}) CREATE UNIQUE (l)<-[:BELONGS_TO_LIST]-(r)", {
			listId: list.id,
			rudelId: rudel.id
		}).then(() => {});
	}
	
	export function removeRudel(transaction: Transaction, list: List, rudel: Rudel): Promise<void> {
		return transaction.run("MATCH(l:List {id : $listId })<-[btl:BELONGS_TO_LIST]-(r:Rudel {id: $rudelId}) DETACH DELETE btl", {
			listId: list.id,
			rudelId: rudel.id
		}).then(() => {});
	}
	
	export function followers(transaction: Transaction, list: List, skip = 0, limit = 25): Promise<User[]> {
		return transaction.run<User, any>(`MATCH(:List {id: $listId})<-[:FOLLOWS_LIST]-(followers:User) RETURN COALESCE(properties(followers), []) as followers SKIP $skip LIMIT $limit`, {
			listId: list.id,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'followers'));
	}
	
	export function follow(transaction: Transaction, list: List, user: User): Promise<void> {
		return transaction.run("MATCH(u:User {id: $userId}), (l:List {id: $listId}) WITH u, l MERGE (u)-[:FOLLOWS_LIST {createdAt: $now}]->(l) WITH u, l OPTIONAL MATCH (l)<-[ol:OWNS_LIST]-(:User) WITH COUNT(ol) as count, r, u WHERE count = 0 CREATE (l)<-[:OWNS_LIST {createdAt: $now}]-(u)", {
			userId: user.id,
			listId: list.id,
			now: new Date().toISOString()
		}).then(() => {});
	}
	
	export function unfollow(transaction: Transaction, list: List, user: User): Promise<void> {
		return transaction.run("MATCH(u:User {id: $userId}), (l:List {id: $listId}) OPTIONAL MATCH (u)-[ol:OWNS_LIST]->(l) OPTIONAL MATCH (u)-[fl:FOLLOWS_LIST]->(l) DETACH DELETE fl, ol", {
			userId: user.id,
			listId: list.id
		}).then(() => {
			return this.followers(transaction, list, 0, 1).then((followers: User[]) => {
				if(followers.length > 0) return transaction.run("MATCH(l:List {id: $listId}), (u:User {id: $newOwnerId}) CREATE (l)<-[:OWNS_LIST {createdAt: $now}]-(u)", {
					listId: list.id,
					now: new Date().toISOString(),
					newOwnerId: followers.pop().id
				});
				
				// Delete list, because it's an orphan node.
				return transaction.run("MATCH(l:List {id: $listId}) CALL apoc.index.removeNodeByName('List', l) DETACH DELETE l", {
					listId: list.id
				});
			}).then(() => {});
		});
	}
	
	export function getRudelMap(transaction: Transaction, rudel: Rudel, user: User, skip = 0, limit = 25): Promise<{
		list: List,
		hasRudel: boolean
	}[]> {
		return transaction.run<any[], any>("MATCH(u:User {id: $userId}), (r:Rudel {id: $rudelId}) MATCH (u)-[:OWNS_LIST]->(l:List) SKIP $skip LIMIT $limit WITH l, r OPTIONAL MATCH (l)<-[btl:BELONGS_TO_LIST]-(r) WITH {list: properties(l), hasRudel: COUNT(btl) > 0} as map RETURN COALESCE(properties(map), []) as map", {
			userId: user.id,
			rudelId: rudel.id,
			limit: limit,
			skip: skip
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'map')).then((map: any[]) => {
			return map.map(map => {
				return {
					list: DatabaseManager.neo4jFunctions.unflatten(map.list),
					hasRudel: map.hasRudel
				};
			});
		});
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [POST] /api/lists/create
		 * @param request Request-Object
		 * @param request.payload.icon icon
		 * @param request.payload.translations translations
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function create(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ListController.create(transaction, {
				translations: request.payload.translations
			}).then((list: List) => {
				return ListController.follow(transaction, list, request.auth.credentials).then(() => {
					return ListController.getPublicList(transaction, list, request.auth.credentials);
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/lists/=/{id}
		 * @param request Request-Object
		 * @param request.params.id list
		 * @param request.payload.translations translations
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function update(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ListController.get(transaction, request.params.id).then((list: List) => {
				if (!list) return Promise.reject(Boom.badRequest('List does not exist!'));
				return ListController.getOwner(transaction, list).then((owner: User) => {
					if (owner.id != request.auth.credentials.id) return Promise.reject(Boom.forbidden('You do not have enough privileges to perform this operation'));
					
					// Update list.
					if (request.payload.translations) list.translations = request.payload.translations;
					return ListController.save(transaction, list);
				}).then(() => ListController.getPublicList(transaction, list, request.auth.credentials));
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/lists/=/{id}
		 * @param request Request-Object
		 * @param request.params.id list
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getList(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ListController.get(transaction, request.params.id).then((list: List) => {
				if (!list) return Promise.reject(Boom.notFound('List not found!'));
				return ListController.getPublicList(transaction, list, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/lists/=/{id}/rudel
		 * @param request Request-Object
		 * @param request.params.id list
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getRudel(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ListController.get(transaction, request.params.id).then((list: List) => {
				if (!list) return Promise.reject(Boom.badRequest('List does not exist!'));
				return ListController.getRudel(transaction, list, request.query.offset, request.query.limit).then((rudel: Rudel[]) => {
					return RudelController.getPublicRudel(transaction, rudel, request.auth.credentials);
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/lists/add-rudel
		 * @param request Request-Object
		 * @param request.payload.list list
		 * @param request.payload.rudel rudel
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function addRudel(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = Promise.all([
				ListController.get(transaction, request.payload.list).then((list: List) => {
					if (list) return ListController.getOwner(transaction, list).then(user => user && user.id == request.auth.credentials.id ? list : null);
					return null;
				}),
				RudelController.get(transaction, request.payload.rudel)
			]).then((values: [List, Rudel]) => {
				let list = values[0];
				let rudel = values[1];
				
				if (!list || !rudel) return Promise.reject(Boom.badData('List or rudel does not exist or is not owned by authenticated user!'));
				return ListController.addRudel(transaction, list, rudel);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/lists/delete-rudel
		 * @param request Request-Object
		 * @param request.payload.list list
		 * @param request.payload.rudel rudel
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function deleteRudel(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = Promise.all([
				ListController.get(transaction, request.payload.list).then((list: List) => {
					if (list) return ListController.getOwner(transaction, list).then(user => user && user.id == request.auth.credentials.id ? list : null);
					return null;
				}),
				RudelController.get(transaction, request.payload.rudel)
			]).then((values: [List, Rudel]) => {
				let list = values[0];
				let rudel = values[1];
				
				if (!list || !rudel) return Promise.reject(Boom.badData('List or rudel does not exist or is not owned by authenticated user!'));
				return ListController.removeRudel(transaction, list, rudel);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/lists/by/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getListsBy(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then(user => {
				if (!user) return Promise.reject(Boom.notFound('User not found!'));
				return ListController.findByUser(transaction, user, request.query.offset, request.query.limit);
			}).then((lists: List[]) => ListController.getPublicList(transaction, lists, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/lists/like/{query}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getListsLike(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ListController.findByFulltext(transaction, request.params.query, request.query.offset, request.query.limit).then((lists: List[]) => {
				return ListController.getPublicList(transaction, lists, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/lists/=/{id}/followers
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
			let promise: Promise<any> = ListController.get(transaction, request.params.id).then((list: List) => {
				if (!list) return Promise.reject<User[]>(Boom.badRequest('List does not exist!'));
				return ListController.followers(transaction, list, request.query.offset, request.query.limit);
			}).then((users: User[]) => UserController.getPublicUser(transaction, users, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/lists/follow/{list}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.list list
		 * @param reply Reply-Object
		 */
		export function follow(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ListController.get(transaction, request.params.list).then((list: List) => {
				if (!list) return Promise.reject(Boom.badRequest('List does not exist!'));
				return ListController.follow(transaction, list, request.auth.credentials).then(() => ListController.getPublicList(transaction, list, request.auth.credentials));
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/lists/unfollow/{list}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.list list
		 * @param reply Reply-Object
		 */
		export function unfollow(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ListController.get(transaction, request.params.list).then((list: List) => {
				if (!list) return Promise.reject(Boom.badRequest('List does not exist!'));
				return ListController.unfollow(transaction, list, request.auth.credentials).then(() => {
					return ListController.get(transaction, list.id).then(list => {
						return list ? ListController.getPublicList(transaction, list, request.auth.credentials) : null;
					});
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/lists/map-of-rudel/{id}
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getRudelMap(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.id).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.badRequest('Rudel does not exist!'));
				return ListController.getRudelMap(transaction, rudel, request.auth.credentials, request.query.offset, request.query.limit);
			}).then((pairs: any) => {
				return ListController.getPublicList(transaction, pairs.map((pair: any) => pair.list), request.auth.credentials).then((lists: any[]) => {
					return lists.map((list: any, i: number) => {
						return {
							list: list,
							hasRudel: pairs[i].hasRudel
						};
					});
				});
			});
			
			reply.api(promise, transactionSession);
		}
	}
}
