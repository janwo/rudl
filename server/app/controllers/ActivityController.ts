import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {DatabaseManager} from "../Database";
import {Cursor} from "arangojs";
import {Activity} from "../models/activities/Activity";
import {User} from "../models/users/User";
import {UserController} from "./UserController";
import {UserRatedActivity} from "../models/activities/UserRatedActivity";
import {UserFollowsActivity} from "../models/activities/UserFollowsActivity";
import {Translations} from "../models/Translations";
import {UserOwnsActivity} from "../models/activities/UserOwnsActivity";
import {List} from "../models/lists/List";
import {ListController} from "./ListController";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import _ = require("lodash");

export module ActivityController {
	
	export function getPublicActivity(activity: Activity | Activity[], relatedUser: User) : Promise<any> {
		let createPublicActivity = (activity: Activity) : Promise<any> => {
			let activityOwnerPromise = getActivityOwner(activity);
			let publicActivityOwnerPromise = activityOwnerPromise.then((owner: User) => {
				return UserController.getPublicUser(owner, relatedUser);
			});
			let activityStatisticsPromise = getActivityStatistics(activity, relatedUser);
			
			return Promise.all([
				activityOwnerPromise,
				publicActivityOwnerPromise,
				activityStatisticsPromise
			]).then((values: [User, any, ActivityStatistics]) => {
				// Add default links.
				let links = {};
				
				// Build profile.
				return Promise.resolve(dot.transform({
					'activity._key': 'id',
					'activity.translations': 'translations',
					'owner': 'owner',
					'links': 'links',
					'isOwner': 'relations.isOwned',
					'statistics.isFollowed': 'relations.isFollowed',
					'statistics.activities': 'statistics.activities',
					'statistics.followers': 'statistics.followers',
					'statistics.lists': 'statistics.lists',
					'statistics.events': 'statistics.events'
				}, {
					activity: activity,
					links: links,
					statistics: values[2],
					owner: values[1],
					isOwner: values[0]._key == relatedUser._key
				}));
			});
		};
			
		let now = Date.now();
		let transformed = activity instanceof Array ? Promise.all(activity.map(createPublicActivity)) : createPublicActivity(activity);
		return transformed.then((result: any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' activities' : '1 activity'} took ${Date.now() - now} millis`);
			return result;
		});
	}
	
	export function findByUser(user: User, ownsOnly = false) : Promise<Activity[]>{
		let aqlQuery = `FOR activity IN OUTBOUND @user @@edges RETURN activity`;
		let aqlParams = {
			'@edges': ownsOnly ? DatabaseManager.arangoCollections.userOwnsActivity.name : DatabaseManager.arangoCollections.userFollowsActivity.name,
			user: user._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<Activity[]>;
	}
	
	export function findByKey(key: string) : Promise<Activity>{
		let aqlQuery = `FOR activity IN @@collection FILTER activity._key == @key RETURN activity`;
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.activities.name,
			key: key
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<Activity>;
	}
	
	export function findByFulltext(query: string) : Promise<Activity[]>{
		//TODO use languages of user
		let aqlQuery = `FOR activity IN FULLTEXT(@@collection, "translations.de", @query) RETURN activity`;
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.activities.name,
			query: query.split(' ').map(word => '|prefix:' + word).join()
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<Activity[]>;
	}
	
	export function getActivityOwner(activity: Activity) : Promise<User> {
		let aqlQuery = `FOR owner IN INBOUND @activityId @@userOwnsActivity RETURN owner`;
		let aqlParams = {
			'@userOwnsActivity': DatabaseManager.arangoCollections.userOwnsActivity.name,
			activityId: activity._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<User>;
	}
	
	export interface ActivityStatistics {
		lists: number;
		followers: number;
		events: number; //TODO
		isFollowed: boolean;
	}
	
	export function getActivityStatistics(activity: Activity, relatedUser: User) : Promise<ActivityStatistics> {
		let aqlQuery = `LET activityFollowers = (FOR follower IN INBOUND @activityId @@edgesUserFollowsActivity RETURN follower._id) LET lists = (FOR list IN INBOUND @activityId @@edgesListIsItem RETURN list._id) RETURN {isFollowed: LENGTH(INTERSECTION(activityFollowers, [@userId])) > 0, followers: LENGTH(activityFollowers), lists: LENGTH(lists)}`;
		let aqlParams = {
			'@edgesUserFollowsActivity': DatabaseManager.arangoCollections.userFollowsActivity.name,
			'@edgesListIsItem': DatabaseManager.arangoCollections.listIsItem.name,
			activityId: activity._id,
			userId: relatedUser._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<ActivityStatistics>;
	}
	
	export function setRating(user: User, activity: Activity, rating: number) : Promise<Activity>{
		let collection = DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.userRatedActivity.name);
		
		switch(rating) {
			case 0:
				// Remove edge.
				return collection.removeByExample({
					_from: user._id,
					_to: activity._id
				}).then(() => activity);
			
			default:
				// Create edge.
				let now = new Date().toISOString();
				return collection.byExample({
					_from: user._id,
					_to: activity._id
				}).then(cursor => cursor.next() as any as UserRatedActivity).then((userRatedActivity : UserRatedActivity) => {
					userRatedActivity = userRatedActivity || {
							_from: user._id,
							_to: activity._id,
							createdAt: now,
							updatedAt: now,
							rating: rating
						};
					userRatedActivity.updatedAt = now;
					userRatedActivity.rating = rating;
					return userRatedActivity;
				}).then(document => collection.save(document)).then(() => activity);
		}
	}
	
	export function getRating(user: User, activity: Activity) : Promise<number>{
		let collection = DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.userRatedActivity.name);
		return collection.byExample({
			_from: user._id,
			_to: activity._id
		}).then(cursor => cursor.next() as any as UserRatedActivity).then((userRatedActivity : UserRatedActivity) => userRatedActivity ? userRatedActivity.rating : 0);
	}
	
	export function addUserConnection(activity: Activity, user: User) : Promise<UserFollowsActivity> {
		let collection = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsActivity.name);
		return collection.firstExample({
			_from: user._id,
			_to: activity._id
		}).then((cursor: Cursor) => cursor.next()).then((userFollowsActivity: UserFollowsActivity) => {
			// Try to return any existing connection.
			if(userFollowsActivity) return userFollowsActivity;
			
			// Add connection.
			let now = new Date().toISOString();
			let edge : UserFollowsActivity = {
				_from: user._id,
				_to: activity._id,
				createdAt: now,
				updatedAt: now
			};
			
			return collection.save(edge);
		});
	}
	
	export function removeUserConnection(activity: User, user: User): Promise<void> {
		let edge = {
			_from: user._id,
			_to: activity._id
		};
		return DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsActivity.name).removeByExample(edge).then(() => {});
	}
	
	export function createActivity(user: User, translations: Translations) : Promise<Activity>{
		// Trim translations.
		let translationKeys = Object.keys(translations);
		translationKeys.forEach(translationKey => translations[translationKey] = translations[translationKey].trim());
		
		// Check, if list with that translation already exist.
		return findByUser(user).then((activities: Activity[]) => {
			for(let i = 0; i < activities.length; i++) {
				let activity = activities[i];
				for(let j = 0; j < translationKeys.length; j++) {
					let translationKey = translationKeys[j];
					if(translations[translationKey] == activity.translations[translationKey]) return Promise.reject<Activity>(Boom.badData(`There is already a activity with the following translation: ${translationKey}`));
				}
			}
		}).then(() => {
			let now = new Date().toISOString();
			let activity : Activity = {
				location: [],//TODO Add location
				createdAt: now,
				updatedAt: now,
				translations: translations
			};
			// TODO Change to vertexCollection, see bug https://github.com/arangodb/arangojs/issues/354
			return DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.activities.name).save(activity).then((activity: Activity) => {
				let userOwnsActivity : UserOwnsActivity = {
					_from: user._id,
					_to: activity._id,
					createdAt: now,
					updatedAt: now
				};
				
				let userFollowsActivity : UserFollowsActivity = {
					_from: user._id,
					_to: activity._id,
					createdAt: now,
					updatedAt: now
				};
				
				return Promise.all([
					DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userOwnsActivity.name).save(userOwnsActivity),
					DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsActivity.name).save(userFollowsActivity)
				]).then(() => activity);
			})
		});
	}
	
	export function getLists(activity: Activity, follower: User = null, ownsOnly: boolean = false) : Promise<List[]>{
		let aqlQuery = `FOR list IN INBOUND @activityId @@listIsItem RETURN list`;
		let aqlParams = {
			'@listIsItem': DatabaseManager.arangoCollections.listIsItem.name,
			activityId: activity._id
		};
		
		if(follower) {
			aqlQuery = `FOR list IN INTERSECTION((FOR list IN OUTBOUND @userId @@followerEdge RETURN list), (FOR list IN INBOUND @activityId @@listIsItem RETURN list)) SORT list._id DESC RETURN list`;
			aqlParams['userId'] = follower._id;
			aqlParams['@followerEdge'] = ownsOnly ? DatabaseManager.arangoCollections.userOwnsList.name : DatabaseManager.arangoCollections.userFollowsList.name;
		}
		
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<List[]>;
	}
	
	//TODO Ownership
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [POST] /api/activities/create
		 * @param request Request-Object
		 * @param request.payload.translations translations
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function createActivity(request: any, reply: any): void {
			// Create promise.
			let promise: Promise<Activity> = ActivityController.createActivity(request.auth.credentials, request.payload.translations).then(activity => getPublicActivity(activity, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/activities/set-rating
		 * @param request Request-Object
		 * @param request.params.key activity
		 * @param request.payload.rating rating
		 * @param request.payload.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function setRating(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<Activity> = ActivityController.findByKey(request.payload.activity).then((activity: Activity) => ActivityController.setRating(request.auth.credentials, activity, request.payload.rating)).then((activity: Activity) => {
				return ActivityController.getPublicActivity(activity, request.auth.credentials);
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/activities/=/{key}/lists/{filter?}/{offset?}/{limit?}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.params.filter all, followed, owned
		 * @param request.params.interval? array of [offset, limit?] (optional, default=[0])
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getLists(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = ActivityController.findByKey(request.params.key).then((activity: Activity) => {
				if(!activity) return Promise.reject<List[]>(Boom.badRequest('Activity does not exist!'));
				
				switch (request.params.filter) {
					default:
					case 'all':
						return ActivityController.getLists(activity);
					
					case 'followed':
						return ActivityController.getLists(activity, request.auth.credentials);
					
					case 'owned':
						return ActivityController.getLists(activity, request.auth.credentials, true);
				}
			}).then((lists: List[]) => {
				return lists.slice(request.params.interval[0], request.params.interval[1] > 0 ? request.params.interval[0] + request.params.interval[1] : lists.length);
			}).then((lists: List[]) => ListController.getPublicList(lists, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/activities/=/{key}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getActivity(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<Activity> = ActivityController.findByKey(request.params.key).then((activity: Activity) => ActivityController.getPublicActivity(activity, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/activities/like/{query}/{offset?}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.params.offset offset (optional, default=0)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getActivitiesLike(request: any, reply: any): void {
			// Create promise.
			//TODO slice
			let promise : Promise<Activity[]> = ActivityController.findByFulltext(request.params.query).then((activities: Activity[]) => ActivityController.getPublicActivity(activities.slice(request.params.offset, request.params.offset + 30), request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/activities/by/{username}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getActivitiesBy(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(request.params.username) : request.auth.credentials).then(user => {
				if(user) return ActivityController.findByUser(user);
				return Promise.reject(Boom.notFound('User not found!'));
			}).then((activities: Activity[]) => getPublicActivity(activities, request.auth.credentials));
			
			reply.api(promise);
		}
	}
}
