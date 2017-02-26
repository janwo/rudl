import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {User} from "../models/users/User";
import {DatabaseManager} from "../Database";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import {Cursor} from "arangojs";
import _ = require("lodash");
import {List} from "../models/lists/List";
import {UserController} from "./UserController";
import {Activity} from "../models/activities/Activity";
import {ActivityController} from "./ActivityController";
import {ListIsItem} from "../models/lists/ListIsItem";
import {Translations} from "../models/Translations";
import {UserOwnsList} from "../models/lists/UserOwnsList";
import {UserFollowsList} from "../models/lists/UserFollowsList";

export module ListController {
	
	export function getPublicList(list: List | List[], relatedUser: User) : Promise<any> {
		let createPublicList = (list: List) : Promise<any> => {
			let listOwnerPromise = getListOwner(list);
			let publicListOwnerPromise = listOwnerPromise.then((owner: User) => UserController.getPublicUser(owner, relatedUser));
			let listStatisticsPromise = getListStatistics(list, relatedUser);
			
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
	
	export function getListOwner(list: List) : Promise<User> {
		let aqlQuery = `FOR owner IN INBOUND @listId @@userOwnsList RETURN owner`;
		let aqlParams = {
			'@userOwnsList': DatabaseManager.arangoCollections.userOwnsList.name,
			listId: list._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<User>;
	}
	
	export interface ListStatistics {
		activities: number;
		followers: number;
		isFollowed: boolean;
	}
	
	export function getListStatistics(list: List, relatedUser: User) : Promise<ListStatistics> {
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
		let aqlQuery = `FOR list IN OUTBOUND @userId @@edgeCollection RETURN list`;
		let aqlParams = {
			'@edgeCollection': ownsOnly ? DatabaseManager.arangoCollections.userOwnsList.name : DatabaseManager.arangoCollections.userFollowsList.name,
			userId: user._id
		};
		
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<List[]>;
	}
	
	export function createList(user: User, translations: Translations) : Promise<List>{
		// Trim translations.
		let translationKeys = Object.keys(translations);
		translationKeys.forEach(translationKey => translations[translationKey] = translations[translationKey].trim());
		
		// Check, if list with that translation already exist.
		return findByUser(user).then((lists: List[]) => {
			for(let i = 0; i < lists.length; i++) {
				let list = lists[i];
				for(let j = 0; j < translationKeys.length; j++) {
					let translationKey = translationKeys[j];
					if(translations[translationKey] == list.translations[translationKey]) return Promise.reject<List>(Boom.badData(`There is already a list with the following translation: ${translationKey}`));
				}
			}
		}).then(() => {
			let now = new Date().toISOString();
			let list : List = {
				createdAt: now,
				updatedAt: now,
				translations: translations
			};
			// TODO Change to vertexCollection, see bug https://github.com/arangodb/arangojs/issues/354
			return DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.lists.name).save(list).then((list: List) => {
				let userOwnsList : UserOwnsList = {
					_from: user._id,
					_to: list._id,
					createdAt: now,
					updatedAt: now
				};
				
				let userFollowsList : UserFollowsList = {
					_from: user._id,
					_to: list._id,
					createdAt: now,
					updatedAt: now
				};
				return Promise.all([
					DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userOwnsList.name).save(userOwnsList),
					DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsList.name).save(userFollowsList)
				]).then(() => list);
			})
		});
	}
	
	export function findByKey(key: string | string[]) : Promise<List | List[]>{
		let collection = DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.lists.name);
		return key instanceof Array ? collection.lookupByKeys(key) as Promise<List[]> : collection.document(key) as Promise<List>;
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
		let aqlQuery = `FOR activity IN OUTBOUND @listId @@listIsItem RETURN activity`;
		let aqlParams = {
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
	
	export function addActivityConnection(list: List, activity: Activity) : Promise<ListIsItem>{
		let collection = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.listIsItem.name);
		return collection.firstExample({
			_from: list._id,
			_to: activity._id
		}).then((listIsItem : ListIsItem) => {
			// Try to return any existing connection.
			if(listIsItem) return listIsItem;
		}).catch(() => {
			// Add connection.
			let now = new Date().toISOString();
			let edge : ListIsItem = {
				_from: list._id,
				_to: activity._id,
				createdAt: now,
				updatedAt: now
			};
			
			return collection.save(edge);
			//TODO nicht in catch
		});
	}
	
	export function removeActivityConnection(list: List, activity: Activity) : Promise<List>{
		let collection = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).vertexCollection(DatabaseManager.arangoCollections.listIsItem.name);
		return collection.removeByExample({
			_from: list._id,
			_to: activity._id
		}).then(() => list);
	}
	
	export function addUserConnection(list: List, user: User) : Promise<UserFollowsList> {
		let collection = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsList.name);
		return collection.firstExample({
			_from: user._id,
			_to: list._id
		}).then((cursor: Cursor) => cursor.next()).then((userFollowsList: UserFollowsList) => {
			// Try to return any existing connection.
			if(userFollowsList) return userFollowsList;
			
			// Add connection.
			let now = new Date().toISOString();
			let edge : UserFollowsList = {
				_from: user._id,
				_to: list._id,
				createdAt: now,
				updatedAt: now
			};
			
			return collection.save(edge);
		});
	}
	
	export function removeUserConnection(list: List, user: User): Promise<void> {
		let edge = {
			_from: user._id,
			_to: list._id
		};
		return DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsList.name).removeByExample(edge).then(() => {});
	}
	
	//TODO Ownership
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [POST] /api/lists/create
		 * @param request Request-Object
		 * @param request.payload.translations translations
		 * @param request.payload.activities activities
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function createList(request: any, reply: any): void {
			// Create promise.
			let activities = request.payload.activities || [];
			let promise: Promise<List> = ListController.createList(request.auth.credentials, request.payload.translations).then(list => {
				activities = activities.map(activity => {
					return ActivityController.findByKey(activity).then(activity => {
						if(activity) return ListController.addActivityConnection(list, activity);
					});
				});
				
				return Promise.all(activities).then(() => list);
			}).then(list => getPublicList(list, request.auth.credentials));
			
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
				if(list) return getPublicList(list, request.auth.credentials);
				return Promise.reject(Boom.notFound('List not found!'));
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
					if(list) return ListController.getListOwner(list).then(user => user && user._key == request.auth.credentials._key ? list : null);
					return null;
				}),
				ActivityController.findByKey(request.payload.activity)
			]).then((values: [List, Activity]) => {
				let list = values[0];
				let activity = values[1];
				
				if(!list || !activity) return Promise.reject(Boom.badData('List or activity does not exist or is not owned by authenticated user!'));
				
				return ListController.addActivityConnection(list, activity);
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
					if(list) return ListController.getListOwner(list).then(user => user && user._key == request.auth.credentials._key ? list : null);
					return null;
				}),
				ActivityController.findByKey(request.payload.activity)
			]).then((values: [List, Activity]) => {
				let list = values[0];
				let activity = values[1];
				
				if(!list || !activity) return Promise.reject(Boom.badData('List or activity does not exist or is not owned by authenticated user!'));
				
				return ListController.removeActivityConnection(list, activity);
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
				if(user) return ListController.findByUser(user);
				return Promise.reject(Boom.notFound('User not found!'));
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
			let promise : Promise<List[]> = ListController.findByFulltext(request.params.query).then((lists: List[]) => getPublicList(lists.slice(request.params.offset, request.params.offset + 30), request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/lists/follow/{list}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.list list
		 * @param reply Reply-Object
		 */
		export function addFollowee(request: any, reply: any): void {
			let promise = ListController.findByKey(request.params.list).then((list: List) => {
				return ListController.addUserConnection(list, request.auth.credentials).then(() => getPublicList(list, request.auth.credentials));
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
		export function deleteFollowee(request: any, reply: any): void {
			let promise = ListController.findByKey(request.params.list).then((list: List) => {
				return removeUserConnection(list, request.auth.credentials).then(() => ListController.getPublicList(list, request.auth.credentials));
			});
			
			reply.api(promise);
		}
	}
}
