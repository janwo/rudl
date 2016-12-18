import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {User} from "../models/users/User";
import {DatabaseManager, arangoCollections} from "../Database";
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

export module ListController {
	
	export function getPublicList(list: List | List[], relatedUser: User) : Promise<any> {
		let createPublicList = (list: List) : Promise<any> => {
			let listOwnerPromise = getListOwner(list).then((owner: User) => UserController.getPublicUser(owner, relatedUser));
			let listStatisticsPromise = getListStatistics(list, relatedUser);
			return Promise.all([
				listOwnerPromise,
				listStatisticsPromise
			]).then((values: [any, ListStatistics]) => {
				// Add default links.
				let links = {};
				
				// Build profile.
				return dot.transform({
					'list._key': 'id',
					'list.translations': 'translations',
					'owner': 'owner',
					'relations': 'relations',
					'followers': 'followers',
					'links': 'links'
				}, {
					owner: values[0],
					list: list,
					relations: {
						owning: values[1].owning,
						following: values[1].following
					},
					links: links,
					followers: values[1].followers
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
		owning: boolean;
		following: boolean;
		followers: number;
	}
	
	export function getListOwner(list: List) : Promise<User> {
		let edges = DatabaseManager.arangoClient.edgeCollection(arangoCollections.userOwnsList);
		return edges.inEdges(list._id).then((users: User[]) => users[0]);
	}
	
	export function getListStatistics(list: List, user: User) : Promise<ListStatistics> {
		let aqlQuery = `LET followers = (FOR follower IN INBOUND @listId @@edgesFollows RETURN follower) LET follows = (FOR list IN OUTBOUND @userId @@edgesFollows FILTER list._id == @listId RETURN list) LET owns = (FOR list IN OUTBOUND @userId @@edgesOwns FILTER list._id == @listId RETURN list) RETURN {owning: LENGTH(owns) > 0, following: LENGTH(follows) > 0, followers: LENGTH(followers)}`;
		let aqlParams = {
			'@edgesFollows': arangoCollections.userFollowsList,
			'@edgesOwns': arangoCollections.userOwnsList,
			listId: list._id,
			userId: user._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<ListStatistics>;
	}
	
	export function getListFollowers(list: List, countOnly: boolean = false) : Promise<User[] | number> {
		let aqlQuery = `FOR user IN INBOUND @listId @@edgesFollows ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN user'}`;
		let aqlParams = {
			'@edgesFollows': arangoCollections.userFollowsList,
			listId: list._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all()) as any as Promise<User[] | number>;
	}
	
	export function getListsBy(user: User, countOnly: boolean = false) : Promise<List[] | number>{
		let aqlQuery = countOnly ?
			`FOR list IN OUTBOUND @userId @@edgesFollows COLLECT WITH COUNT INTO length RETURN length` :
			`FOR list IN OUTBOUND @userId @@edgesFollows RETURN list`;
		let aqlParams = {
			'@edgesFollows': arangoCollections.userFollowsList,
			userId: user._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all()) as any as Promise<List[] | number>;
	}
	
	export function createList(user: User, translations: Translations) : Promise<List>{
		let collection = DatabaseManager.arangoClient.collection(arangoCollections.lists);
		// Trim translations.
		let translationKeys = Object.keys(translations);
		translationKeys.forEach(translationKey => translations[translationKey] = translations[translationKey].trim());
		
		// Check, if list with that translation already exist.
		return getListsBy(user).then((lists: List[]) => {
			for(let i = 0; i < lists.length; i++) {
				let list = lists[i];
				for(let j = 0; j < translationKeys.length; j++) {
					let translationKey = translationKeys[j];
					if(translations[translationKey] == list.translations[translationKey]) return Promise.reject<List>(Boom.badData(`There is already a list with the following translation: ${translationKey}`));
				}
			}
		}).then(() => {
			let now = Date.now();
			let list : List = {
				createdAt: now,
				updatedAt: now,
				translations: translations
			};
			return collection.save(list);
		});
	}
	
	export function getList(key: string, user: User = null) : Promise<List>{
		let aqlQuery = `FOR list IN ${user ? 'OUTBOUND @@userOwnsList @userId' : '@@listCollection'} FILTER list._key == @listKey RETURN list`;
		let aqlParams = {
			listKey: key
		};
		
		if(user) {
			aqlParams['@userOwnsList'] = arangoCollections.userOwnsList;
			aqlParams['user'] = user._id;
		}
		if(!user) aqlParams['@listCollection'] = arangoCollections.lists;
		
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<List>;
	}
	
	export function getListsLike(query: string, countOnly: boolean = false) : Promise<List[] | number>{
		let aqlQuery = `FOR list IN FULLTEXT(@@collection, "name", @query) ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN list'}`;
		let aqlParams = {
			'@collection': arangoCollections.lists,
			query: query.split(' ').map(word => '|' + word).join()
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all()) as any as Promise<List[] | number>;
	}
	
	export function getActivities(list: List, countOnly: boolean = false) : Promise<Activity[] | number>{
		let aqlQuery = `FOR activity IN OUTBOUND @list @@edges ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN activity'}`;
		let aqlParams = {
			'@edges': arangoCollections.listIsItem,
			list: list
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all()) as any as Promise<Activity[] | number>;
	}
	
	export function addActivity(list: List, activity: Activity) : Promise<List>{
		let collection = DatabaseManager.arangoClient.collection(arangoCollections.listIsItem);
		return collection.byExample({
			_from: list._id,
			_to: activity._id
		}).then(cursor => cursor.next() as any as ListIsItem).then((listIsItem : ListIsItem) => {
			if(listIsItem) return list;
			
			let now = Date.now();
			let edge : ListIsItem = {
				_from: list._id,
				_to: activity._id,
				createdAt: now,
				updatedAt: now
			};
			
			return collection.save(edge);
		}).then(() => list);
	}
	
	export function deleteActivity(list: List, activity: Activity) : Promise<List>{
		let collection = DatabaseManager.arangoClient.collection(arangoCollections.listIsItem);
		return collection.removeByExample({
			_from: list._id,
			_to: activity._id
		}).then(() => list);
	}
	
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
					return ActivityController.getActivity(activity).then(activity => {
						if(activity) return ListController.addActivity(list, activity);
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
			let paramKey = encodeURIComponent(request.params.key);
			
			// Create promise.
			let promise: Promise<List> = ListController.getList(paramKey).then(list => getPublicList(list, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/lists/=/{key}/activities
		 * @param request Request-Object
		 * @param request.params.key list
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getActivities(request: any, reply: any): void {
			let paramKey = encodeURIComponent(request.params.key);
			
			// Create promise.
			let promise : Promise<any> = ListController.getList(paramKey).then(list => ListController.getActivities(list)).then((activities: Activity[]) => {
				return ActivityController.getPublicActivity(activities);
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
				ListController.getList(request.payload.list, request.auth.credentials),
				ActivityController.getActivity(request.payload.activity)
			]).then((values: [List, Activity]) => {
				let list = values[0];
				let activity = values[1];
				
				if(!list || !activity) return Promise.reject('List or activity does not exist or is not owned by authenticated user!');
				
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
				ListController.getList(request.payload.list. request.auth.credentials),
				ActivityController.getActivity(request.payload.activity)
			]).then((values: [List, Activity]) => {
				let list = values[0];
				let activity = values[1];
				
				if(!list || !activity) return Promise.reject('List or activity does not exist or is not owned by authenticated user!');
				
				return ListController.deleteActivity(list, activity);
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
			let paramUsername = encodeURIComponent(request.params.username);
			
			// Create promise.
			let promise : Promise<any> = Promise.resolve(paramUsername != 'me' ? UserController.findByUsername(paramUsername) : request.auth.credentials).then(user => {
				return ListController.getListsBy(user);
			}).then((lists: List[]) => getPublicList(lists, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/lists/like/{query}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getListsLike(request: any, reply: any): void {
			let paramQuery = encodeURIComponent(request.params.query);
			
			// Create promise.
			let promise : Promise<List[]> = ListController.getListsLike(paramQuery).then((lists: List[]) => getPublicList(lists, request.auth.credentials));
			
			reply.api(promise);
		}
	}
}
