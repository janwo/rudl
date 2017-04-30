import * as Boom from "boom";
import * as dot from "dot-object";
import {User} from "../models/user/User";
import {DatabaseManager} from "../Database";
import {Cursor} from "arangojs";
import {List} from "../models/list/List";
import {UserController} from "./UserController";
import {Activity} from "../models/activity/Activity";
import {ActivityController} from "./ActivityController";
import {ListIsItem} from "../models/list/ListIsItem";
import {Translations} from "../models/Translations";
import {UserOwnsList} from "../models/list/UserOwnsList";
import {UserFollowsList} from "../models/list/UserFollowsList";
import {ListRecipe} from "../../../client/app/models/list";

export module ListController {
	
	export function getPublicList(list: List | List[], relatedUser: User) : Promise<any> {
		let createPublicList = (list: List) : Promise<any> => {
			let listOwnerPromise = ListController.getOwner(list);
			let publicListOwnerPromise = listOwnerPromise.then((owner: User) => UserController.getPublicUser(owner, relatedUser));
			let listStatisticsPromise = ListController.getStatistics(list, relatedUser);
			
			return Promise.all([
				listOwnerPromise,
				publicListOwnerPromise,
				listStatisticsPromise
			]).then((values: [User, any, ListStatistics]) => {
				// Add default links.
				let links = {};
				
				// Build profile.
				return dot.transform({
					'list._key': 'id',
					'list.translations': 'translations',
					'owner': 'owner',
					'links': 'links',
					'isOwner': 'relations.isOwned',
					'statistics.isFollowed': 'relations.isFollowed',
					'statistics.activities': 'statistics.activities',
					'statistics.followers': 'statistics.followers'
				}, {
					list: list,
					statistics: values[2],
					links: links,
					owner: values[1],
					isOwner: values[0]._key == relatedUser._key
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
		activities: number;
		followers: number;
		isFollowed: boolean;
	}
	
	export function getStatistics(list: List, relatedUser: User) : Promise<ListStatistics> {
		let aqlQuery = `LET listFollowers = (FOR follower IN INBOUND @listId @@edgesUserFollowsList RETURN follower._id) LET listActivities = (FOR activity IN OUTBOUND @listId @@edgesListIsItem RETURN activity._id) RETURN {isFollowed: LENGTH(INTERSECTION(listFollowers, [@userId])) > 0, followers: LENGTH(listFollowers), activities: LENGTH(listActivities)}`;
		let aqlParams = {
			'@edgesUserFollowsList': DatabaseManager.arangoCollections.userFollowsList.name,
			'@edgesListIsItem': DatabaseManager.arangoCollections.listIsItem.name,
			listId: list._id,
			userId: relatedUser._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<ListStatistics>;
	}
	
	export function findByUser(user: User, ownsOnly = false) : Promise<List[]>{
		return DatabaseManager.arangoFunctions.outbounds(user._id, ownsOnly ? DatabaseManager.arangoCollections.userOwnsList.name : DatabaseManager.arangoCollections.userFollowsList.name);
	}
	
	export function create(recipe: ListRecipe): Promise<List>{
		let list : List = {
			createdAt: null,
			updatedAt: null,
			translations: recipe.translations
		};
		return Promise.resolve(list);
	}
	
	export function save(list: List): Promise<List> {
		// Trim translations.
		let translationKeys: string[] = Object.keys(list.translations);
		translationKeys.forEach((translationKey: string) => list.translations[translationKey] = list.translations[translationKey].trim());
		
		// Save.
		return DatabaseManager.arangoFunctions.updateOrCreate(list, DatabaseManager.arangoCollections.lists.name);
	}
	
	/**
	 * Changes the ownership of the list to a user.
	 * @param list
	 * @returns {Promise<any>|Promise<TResult|any>|Promise<TResult>|Promise<TResult2|TResult1>}
	 */
	export function setOwner(list: List, owner: User): Promise<List> {
		let graph = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name);
		let owns = graph.edgeCollection(DatabaseManager.arangoCollections.userOwnsList.name);
		
		// Exists owner edge?
		return owns.byExample({
			_to: list._id
		}, {
			limit: 1
		}).then(cursor => cursor.next() as any as UserOwnsList).then((edge: UserOwnsList) => {
			// Create new edge?
			if(!edge) edge = {
				_to: list._id,
				_from: owner._id
			};
			
			// Update edge.
			edge._from = owner._id;
			return DatabaseManager.arangoFunctions.updateOrCreate(edge, DatabaseManager.arangoCollections.userOwnsList.name);
		}).then(() => list);
	}
	
	export function getOwner(list: List) : Promise<User> {
		return DatabaseManager.arangoFunctions.inbound(list._id, DatabaseManager.arangoCollections.userOwnsList.name);
	}
	
	export function remove(list: List): Promise<any> {
		let graph = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name);
		return graph.vertexCollection(DatabaseManager.arangoCollections.lists.name).remove(list._id);
	}
	
	export function findByKey(key: string | string[]) : Promise<List | List[]>{
		let collection = DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.lists.name);
		return key instanceof Array ? collection.lookupByKeys(key) as Promise<List[]> : collection.byExample({
			_key: key
		}, {
			limit: 1
		}).then(cursor => cursor.next()) as any as Promise<List|List[]>;
	}
	
	export function findByFulltext(query: string) : Promise<List[]>{
		//TODO use languages of user
		let aqlQuery = `FOR list IN FULLTEXT(@@collection, "translations.de", @query) RETURN list`;
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.lists.name,
			query: query.split(' ').map(word => '+prefix:' + word).join()
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<List[]>;
	}
	
	export function getActivities(list: List, follower: User = null, ownsOnly: boolean = false) : Promise<Activity[]>{
		let aqlQuery: string = `FOR activity IN OUTBOUND @listId @@listIsItem RETURN activity`;
		let aqlParams: {[key: string]: string} = {
			'@listIsItem': DatabaseManager.arangoCollections.listIsItem.name,
			listId: list._id
		};
		
		if(follower) {
			aqlQuery = `FOR activity IN INTERSECTION((FOR activity IN OUTBOUND @userId @@followerEdge RETURN activity), (FOR activity IN OUTBOUND @listId @@listIsItem RETURN activity)) SORT activity._id DESC RETURN activity`;
			aqlParams['userId'] = follower._id;
			aqlParams['@followerEdge'] = ownsOnly ? DatabaseManager.arangoCollections.userOwnsActivity.name : DatabaseManager.arangoCollections.userFollowsActivity.name;
		}
		
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<Activity[]>;
	}
	
	export function addActivity(list: List, activity: Activity) : Promise<ListIsItem>{
		let collection = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.listIsItem.name);
		return collection.byExample({
			_from: list._id,
			_to: activity._id
		}, {
			limit: 1
		}).then(cursor => cursor.next() as any as ListIsItem).then((listIsItem : ListIsItem) => {
			// Try to return any existing connection.
			if(listIsItem) return listIsItem;
			
			// Add connection.
			let edge : ListIsItem = {
				_from: list._id,
				_to: activity._id
			};
			
			return DatabaseManager.arangoFunctions.updateOrCreate(edge, DatabaseManager.arangoCollections.listIsItem.name);
		});
	}
	
	export function removeActivity(list: List, activity: Activity) : Promise<List>{
		let collection = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).vertexCollection(DatabaseManager.arangoCollections.listIsItem.name);
		return collection.removeByExample({
			_from: list._id,
			_to: activity._id
		}).then(() => list);
	}
	
	export function followers(list: List) : Promise<User[]> {
		return DatabaseManager.arangoFunctions.inbounds(list._id, DatabaseManager.arangoCollections.userFollowsList.name);
	}
	
	export function follow(list: List, user: User) : Promise<UserFollowsList> {
		let collection = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsList.name);
		return collection.byExample({
			_from: user._id,
			_to: list._id
		}, {
			limit: 1
		}).then((cursor: Cursor) => cursor.next() as any as UserFollowsList).then((userFollowsList: UserFollowsList) => {
			// Try to return any existing connection.
			if(userFollowsList) return userFollowsList;
			
			// Add connection.
			let edge: UserFollowsList = {
				_from: user._id,
				_to: list._id
			};
			
			return DatabaseManager.arangoFunctions.updateOrCreate(edge, DatabaseManager.arangoCollections.userFollowsList.name);
		});
	}
	
	export function unfollow(list: List, user: User): Promise<void> {
		let graph = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name);
		let follows = graph.edgeCollection(DatabaseManager.arangoCollections.userFollowsList.name);
		return follows.removeByExample({
			_from: user._id,
			_to: list._id
		}).then(() => {
			return ListController.getOwner(list).then(owner => {
				// Change owner ship?
				if(owner._id == user._id) {
					// Get a remaining follower.
					return DatabaseManager.arangoFunctions.inbound(list._id, DatabaseManager.arangoCollections.userFollowsList.name).then((follower: User) => {
						// Change ownership, if follower exists or delete list.
						if(follower) return ListController.setOwner(list, follower).then(() => {});
						return ListController.remove(list);
					});
				}
			})
		});
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [POST] /api/lists/create
		 * @param request Request-Object
		 * @param request.payload.icon icon
		 * @param request.payload.translations translations
		 * @param request.payload.activities activities (optional)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function create(request: any, reply: any): void {
				// Create promise.
			let promise: Promise<List> = ListController.create({
					translations: request.payload.translations
			}).then(list => ListController.save(list)).then(list => {
				let jobs: any[] = [
					ListController.follow(list, request.auth.credentials),
					ListController.setOwner(list, request.auth.credentials),
					ActivityController.findByKey(request.payload.activities || []).then((activities: Activity[]) => {
						return Promise.all(activities.map(activity => ListController.addActivity(list, activity)));
					})
				];
				
				return Promise.all(jobs).then(() => list);
			}).then(list => ListController.getPublicList(list, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/lists/=/{key}
		 * @param request Request-Object
		 * @param request.params.key list
		 * @param request.payload.translations translations
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function update(request: any, reply: any): void {
			// Create promise.
			let promise: Promise<List> = ListController.findByKey(request.params.key).then((list: List) => {
				if(!list) return Promise.reject<List>(Boom.badRequest('List does not exist!'));
				
				return ListController.getOwner(list).then(owner => {
					if (owner._key != request.auth.credentials._key) return Promise.reject<List>(Boom.forbidden('You do not have enough privileges to perform this operation'));
					
					// Update list.
					if (request.payload.translations) list.translations = request.payload.translations;
					return ListController.save(list);
				}).then(list => ListController.getPublicList(list, request.auth.credentials));
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/lists/=/{key}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getList(request: any, reply: any): void {
			// Create promise.
			let promise: Promise<List> = ListController.findByKey(request.params.key).then(list => {
				if (!list) return Promise.reject(Boom.notFound('List not found!'));
				return getPublicList(list, request.auth.credentials);
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/lists/=/{key}/activities/{filter?}/{offset?}/{limit?}'
		 * @param request Request-Object
		 * @param request.params.key list
		 * @param request.params.filter all, followed, owned
		 * @param request.params.interval? array of [offset, limit?] (optional, default=[0])
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getActivities(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = ListController.findByKey(request.params.key).then((list: List) => {
				if(!list) return Promise.reject(Boom.badRequest('List does not exist!'));
				
				switch (request.params.filter) {
					default:
					case 'all':
						return ListController.getActivities(list);
						
					case 'followed':
						return ListController.getActivities(list, request.auth.credentials);
						
					case 'owned':
						return ListController.getActivities(list, request.auth.credentials, true);
				}
			}).then((activities: Activity[]) => {
				return activities.slice(request.params.interval[0], request.params.interval[1] > 0 ? request.params.interval[0] + request.params.interval[1] : activities.length);
			}).then((activities: Activity[]) => {
				return ActivityController.getPublicActivity(activities, request.auth.credentials);
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/lists/add-activity
		 * @param request Request-Object
		 * @param request.payload.list list
		 * @param request.payload.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function addActivity(request: any, reply: any): void {
			// Create promise.
			let promise = Promise.all([
				ListController.findByKey(request.payload.list).then((list: List) => {
					if(list) return ListController.getOwner(list).then(user => user && user._key == request.auth.credentials._key ? list : null);
					return null;
				}),
				ActivityController.findByKey(request.payload.activity)
			]).then((values: [List, Activity]) => {
				let list = values[0];
				let activity = values[1];
				
				if(!list || !activity) return Promise.reject(Boom.badData('List or activity does not exist or is not owned by authenticated user!'));
				
				return ListController.addActivity(list, activity);
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/lists/delete-activity
		 * @param request Request-Object
		 * @param request.payload.list list
		 * @param request.payload.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function deleteActivity(request: any, reply: any): void {
			// Create promise.
			let promise = Promise.all([
				ListController.findByKey(request.payload.list).then((list: List) => {
					if(list) return ListController.getOwner(list).then(user => user && user._key == request.auth.credentials._key ? list : null);
					return null;
				}),
				ActivityController.findByKey(request.payload.activity)
			]).then((values: [List, Activity]) => {
				let list = values[0];
				let activity = values[1];
				
				if(!list || !activity) return Promise.reject(Boom.badData('List or activity does not exist or is not owned by authenticated user!'));
				
				return ListController.removeActivity(list, activity);
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/lists/by/{username}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getListsBy(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(request.params.username) : request.auth.credentials).then(user => {
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return ListController.findByUser(user);
			}).then((lists: List[]) => getPublicList(lists, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/lists/like/{query}/{offset?}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.params.offset offset (optional, default=0)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getListsLike(request: any, reply: any): void {
			// Create promise.
			//TODO offset
			let promise : Promise<List[]> = ListController.findByFulltext(request.params.query).then((lists: List[]) => {
				return ListController.getPublicList(lists.slice(request.params.offset, request.params.offset + 30), request.auth.credentials);
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/lists/=/{key}/followers/{offset?}/{limit?}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function followers(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = ListController.findByKey(request.params.key).then((list: List) => {
				if (!list) return Promise.reject<User[]>(Boom.badRequest('List does not exist!'));
				return ListController.followers(list);
			}).then((users: User[]) => UserController.getPublicUser(users, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/lists/follow/{list}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.list list
		 * @param reply Reply-Object
		 */
		export function follow(request: any, reply: any): void {
			let promise = ListController.findByKey(request.params.list).then((list: List) => {
				if (!list) return Promise.reject(Boom.badRequest('List does not exist!'));
				return ListController.follow(list, request.auth.credentials).then(() => ListController.getPublicList(list, request.auth.credentials));
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/lists/unfollow/{list}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.list list
		 * @param reply Reply-Object
		 */
		export function unfollow(request: any, reply: any): void {
			let promise = ListController.findByKey(request.params.list).then((list: List) => {
				if (!list) return Promise.reject(Boom.badRequest('List does not exist!'));
				return ListController.unfollow(list, request.auth.credentials).then(() => {
					return ListController.findByKey(list._key).then(list => list ? ListController.getPublicList(list, request.auth.credentials) : null);
				});
			});
			
			reply.api(promise);
		}
	}
}
