import * as Boom from "boom";
import * as dot from "dot-object";
import {DatabaseManager} from "../Database";
import {Cursor} from "arangojs";
import {Activity} from "../models/activity/Activity";
import {User} from "../models/user/User";
import {UserController} from "./UserController";
import {UserRatedActivity} from "../models/activity/UserRatedActivity";
import {UserFollowsActivity} from "../models/activity/UserFollowsActivity";
import {Translations} from "../models/Translations";
import {UserOwnsActivity} from "../models/activity/UserOwnsActivity";
import {List} from "../models/list/List";
import {ListController} from "./ListController";
import {UtilController} from "./UtilController";
import {ExpeditionController} from "./ExpeditionController";

export module CommentController {
	
	export function create(recipe: {
		translations: Translations,
		icon: string
	}) : Promise<Activity>{
		let activity: Activity = {
			icon: recipe.icon,
			translations: recipe.translations,
			defaultLocation: null,
			createdAt: null,
			updatedAt: null
		};
		return Promise.resolve(activity);
	}
	
	export function save(activity: Activity): Promise<Activity> {
		// Trim translations.
		let translationKeys: string[] = Object.keys(activity.translations);
		translationKeys.forEach((translationKey: string) => activity.translations[translationKey] = activity.translations[translationKey].trim());
		
		// Save.
		return DatabaseManager.arangoFunctions.updateOrCreate(activity, DatabaseManager.arangoCollections.activities.name);
	}
	
	export function remove(activity: Activity): Promise<any> {
		let graph = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name);
		return Promise.all([
			// Remove all expeditions.
			ExpeditionController.removeExpeditions(activity)
			// TODO Remove all comments.
		]).then(() => graph.vertexCollection(DatabaseManager.arangoCollections.activities.name).remove(activity._id));
	}
	
	export function getPublicActivity(activity: Activity | Activity[], relatedUser: User) : Promise<any> {
		let createPublicActivity = (activity: Activity) : Promise<any> => {
			let activityOwnerPromise = ActivityController.getOwner(activity);
			let publicActivityOwnerPromise = activityOwnerPromise.then((owner: User) => {
				return UserController.getPublicUser(owner, relatedUser);
			});
			let activityStatisticsPromise = ActivityController.getStatistics(activity, relatedUser);
			
			return Promise.all([
				activityOwnerPromise,
				publicActivityOwnerPromise,
				activityStatisticsPromise
			]).then((values: [User, any, ActivityStatistics]) => {
				// Add default links.
				let links = {
					icon: UtilController.getIconUrl(activity.icon)
				};
				debugger;
				// Build profile.
				return Promise.resolve(dot.transform({
					'activity._key': 'id',
					'activity.translations': 'translations',
					'activity.icon': 'icon',
					'defaultLocation': 'defaultLocation',
					'owner': 'owner',
					'links': 'links',
					'isOwner': 'relations.isOwned',
					'statistics.isFollowed': 'relations.isFollowed',
					'statistics.activities': 'statistics.activities',
					'statistics.followers': 'statistics.followers',
					'statistics.lists': 'statistics.lists',
					'statistics.expeditions': 'statistics.expeditions'
				}, {
					activity: activity,
					defaultLocation: activity.defaultLocation || relatedUser.location,
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
		return DatabaseManager.arangoFunctions.outbounds(user._id, ownsOnly ? DatabaseManager.arangoCollections.userOwnsActivity.name : DatabaseManager.arangoCollections.userFollowsActivity.name);
	}
	
	export function findByKey(key: string | string[]): Promise<Activity | Activity[]> {
		let collection = DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.activities.name);
		return key instanceof Array ? collection.lookupByKeys(key) as Promise<Activity[]> : collection.byExample({
			_key: key
		}, {
			limit: 1
		}).then(cursor => cursor.next()) as any as Promise<Activity|Activity[]>;
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
	
	export interface ActivityStatistics {
		lists: number;
		followers: number;
		expeditions: number;
		isFollowed: boolean;
	}
	
	export function getStatistics(activity: Activity, relatedUser: User) : Promise<ActivityStatistics> {
		let aqlQuery = `LET activityFollowers = (FOR follower IN INBOUND @activityId @@edgesUserFollowsActivity RETURN follower._id) LET lists = (FOR list IN INBOUND @activityId @@edgesListIsItem RETURN list._id) LET expeditions = (FOR expedition IN INBOUND @activityId @@edgesExpeditionIsItem RETURN expedition._id) RETURN {isFollowed: LENGTH(INTERSECTION(activityFollowers, [@userId])) > 0, followers: LENGTH(activityFollowers), lists: LENGTH(lists), expeditions: LENGTH(expeditions)}`;
		let aqlParams = {
			'@edgesUserFollowsActivity': DatabaseManager.arangoCollections.userFollowsActivity.name,
			'@edgesListIsItem': DatabaseManager.arangoCollections.listIsItem.name,
			'@edgesExpeditionIsItem': DatabaseManager.arangoCollections.expeditionIsItem.name,
			activityId: activity._id,
			userId: relatedUser._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<ActivityStatistics>;
	}
	
	/**
	 * Changes the ownership of the activity to a user.
	 * @param activity
	 * @returns {Promise<any>|Promise<TResult|any>|Promise<TResult>|Promise<TResult2|TResult1>}
	 */
	export function setOwner(activity: Activity, owner: User): Promise<Activity> {
		let graph = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name);
		let owns = graph.edgeCollection(DatabaseManager.arangoCollections.userOwnsActivity.name);
		
		// Exists owner edge?
		return owns.byExample({
			_to: activity._id
		}, {
			limit: 1
		}).then(cursor => cursor.next() as any as UserOwnsActivity).then((edge: UserOwnsActivity) => {
			// Create new edge?
			if(!edge) edge = {
				_to: activity._id,
				_from: owner._id
			};
			
			// Update edge.
			edge._from = owner._id;
			return DatabaseManager.arangoFunctions.updateOrCreate(edge, DatabaseManager.arangoCollections.userOwnsActivity.name);
		}).then(() => activity);
	}
	
	export function getOwner(activity: Activity) : Promise<User> {
		return DatabaseManager.arangoFunctions.inbound(activity._id, DatabaseManager.arangoCollections.userOwnsActivity.name);
	}
	
	export function follow(activity: Activity, user: User) : Promise<UserFollowsActivity> {
		let collection = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsActivity.name);
		return collection.byExample({
			_from: user._id,
			_to: activity._id
		}, {
			limit: 1
		}).then((cursor: Cursor) => cursor.next() as any as UserFollowsActivity).then((userFollowsActivity: UserFollowsActivity) => {
			// Try to return any existing connection.
			if(userFollowsActivity) return userFollowsActivity;
			
			// Add connection.
			let edge : UserFollowsActivity = {
				_from: user._id,
				_to: activity._id
			};
			
			return DatabaseManager.arangoFunctions.updateOrCreate(edge, DatabaseManager.arangoCollections.userFollowsActivity.name);
		});
	}
	
	
	/**
	 * Removes the user as a follower of the activity.
	 * @param activity
	 * @param user
	 * @returns {Promise<any>|Promise<TResult|any>|Promise<TResult>|Promise<TResult2|TResult1>}
	 */
	export function unfollow(activity: Activity, user: User): Promise<void> {
		let graph = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name);
		let follows = graph.edgeCollection(DatabaseManager.arangoCollections.userFollowsActivity.name);
		return follows.removeByExample({
			_from: user._id,
			_to: activity._id
		}).then(() => {
			return ActivityController.getOwner(activity).then(owner => {
				// Change owner ship?
				if(owner._id == user._id) {
					// Get a remaining follower
					return DatabaseManager.arangoFunctions.inbound(activity._id, DatabaseManager.arangoCollections.userFollowsActivity.name).then((follower: User) => {
						// Change ownership, if follower exists or delete activity.
						if(follower) return ActivityController.setOwner(activity, follower).then(() => {});
						return ActivityController.remove(activity);
					});
				}
			});
		});
	}
	
	export function followers(activity: Activity, ) : Promise<User[]> {
		return DatabaseManager.arangoFunctions.inbounds(activity._id, DatabaseManager.arangoCollections.userFollowsActivity.name);
	}
	
	export function getLists(activity: Activity, follower: User = null, ownsOnly: boolean = false) : Promise<List[]>{
		let aqlQuery: string = `FOR list IN INBOUND @activityId @@listIsItem RETURN list`;
		let aqlParams: {[key: string]: string} = {
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
				}, {
					limit: 1
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
		}, {
			limit: 1
		}).then(cursor => cursor.next() as any as UserRatedActivity).then((userRatedActivity : UserRatedActivity) => userRatedActivity ? userRatedActivity.rating : 0);
	}
	
	//TODO Ownership
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [POST] /api/activities/create
		 * @param request Request-Object
		 * @param request.payload.translations translations
		 * @param request.payload.icon icon
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function create(request: any, reply: any): void {
			// Create promise.
			let promise: Promise<Activity> = ActivityController.create({
				translations: request.payload.translations,
				icon: request.payload.icon
			}).then(activity => ActivityController.save(activity)).then(activity => {
				return Promise.all([
					ActivityController.follow(activity, request.auth.credentials),
					ActivityController.setOwner(activity, request.auth.credentials)
				]).then(() => activity);
			}).then(activity => getPublicActivity(activity, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/activities/=/{key}
		 * @param request Request-Object
		 * @param request.params.key activity
		 * @param request.payload.translations translations
		 * @param request.payload.icon icon
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function update(request: any, reply: any): void {
			// Create promise.
			let promise: Promise<Activity> = ActivityController.findByKey(request.params.key).then((activity: Activity) => {
				if(!activity) return Promise.reject<Activity>(Boom.badRequest('Activity does not exist!'));
				
				return ActivityController.getOwner(activity).then(owner => {
					if (owner._key != request.auth.credentials._key) return Promise.reject<Activity>(Boom.forbidden('You do not have enough privileges to perform this operation'));
					
					// Update activity.
					if (request.payload.icon) activity.icon = request.payload.icon;
					if (request.payload.translations) activity.translations = request.payload.translations;
					return ActivityController.save(activity);
				}).then(activity => ActivityController.getPublicActivity(activity, request.auth.credentials));
			});
			
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
			let promise : Promise<Activity> = ActivityController.findByKey(request.params.key).then((activity: Activity) => {
				if (!activity) return Promise.reject(Boom.notFound('Activity not found.'));
				return ActivityController.getPublicActivity(activity, request.auth.credentials);
			});
			
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
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return ActivityController.findByUser(user);
			}).then((activities: Activity[]) => getPublicActivity(activities, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/activities/follow/{activity}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.activity activity
		 * @param reply Reply-Object
		 */
		export function follow(request: any, reply: any): void {
			let promise = ActivityController.findByKey(request.params.activity).then((activity: Activity) => {
				if(!activity) return Promise.reject(Boom.notFound('Activity not found!'));
				return ActivityController.follow(activity, request.auth.credentials).then(() => ActivityController.getPublicActivity(activity, request.auth.credentials));
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/activities/unfollow/{activity}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.activity activity
		 * @param reply Reply-Object
		 */
		export function unfollow(request: any, reply: any): void {
			let promise = ActivityController.findByKey(request.params.activity).then((activity: Activity) => {
				if(!activity) return Promise.reject(Boom.notFound('Activity not found!'));
				return ActivityController.unfollow(activity, request.auth.credentials).then(() => {
					return ActivityController.findByKey(activity._key).then(activity => activity ? ActivityController.getPublicActivity(activity, request.auth.credentials) : null);
				});
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/activities/=/{key}/followers/{offset?}/{limit?}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function followers(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = ActivityController.findByKey(request.params.key).then((activity: Activity) => {
				if (!activity) return Promise.reject<User[]>(Boom.badRequest('Activity does not exist!'));
				return ActivityController.followers(activity);
			}).then((users: User[]) => UserController.getPublicUser(users, request.auth.credentials));
			
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
			let promise : Promise<Activity> = ActivityController.findByKey(request.payload.activity).then((activity: Activity) => {
				if(!activity) return Promise.reject(Boom.notFound('Activity not found!'));
				return ActivityController.setRating(request.auth.credentials, activity, request.payload.rating);
			}).then((activity: Activity) => ActivityController.getPublicActivity(activity, request.auth.credentials));
			
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
	}
}
