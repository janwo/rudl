import * as Boom from "boom";
import * as dot from "dot-object";
import {DatabaseManager} from "../Database";
import {Cursor} from "arangojs";
import {Activity} from "../models/activity/Activity";
import {User} from "../models/user/User";
import {Expedition} from "../models/expedition/Expedition";
import {UserController} from "./UserController";
import {UserFollowsActivity} from "../models/activity/UserFollowsActivity";
import {UserOwnsExpedition} from "../models/expedition/UserOwnsExpedition";
import {UserJoinsExpedition} from "../models/expedition/UserJoinsExpedition";
import {ExpeditionIsItem} from "../models/expedition/ExpeditionIsItem";
import {ActivityController} from "./ActivityController";
import * as moment from "moment";
import {UtilController} from "./UtilController";
import * as Random from 'random-seed';
import {Config} from '../../../run/config';
import {ExpeditionRecipe} from '../../../client/app/models/expedition';

export module ExpeditionController {
	
	export const FUZZY_HOURS = 3;
	export const FUZZY_METERS = 500;
	
	export function getPublicExpedition(expedition: Expedition | Expedition[], relatedUser: User) : Promise<any> {
		let createPublicExpedition = (expedition: Expedition) : Promise<any> => {
			let expeditionOwnerPromise = ExpeditionController.getOwner(expedition);
			let publicExpeditionOwnerPromise = expeditionOwnerPromise.then((owner: User) => {
				return UserController.getPublicUser(owner, relatedUser);
			});
			let expeditionStatisticsPromise = ExpeditionController.getStatistics(expedition, relatedUser);
			let activityPromise = ExpeditionController.getActivity(expedition).then((activity: Activity) => {
				return ActivityController.getPublicActivity(activity, relatedUser);
			});
			
			return Promise.all([
				expeditionOwnerPromise,
				publicExpeditionOwnerPromise,
				expeditionStatisticsPromise,
			    activityPromise
			]).then((values: [User, any, ExpeditionStatistics, Activity]) => {
				// Add default links.
				let links = {
					icon: UtilController.getIconUrl(expedition.icon)
				};
				
				// Mask data for unapproved users.
				if(!values[2].isApproved) {
					// Seedable randomness to prevent hijacking unmasked data by recalling this function multiple times.
					let randomSeed: Random.RandomSeed = Random.create(expedition._key + Config.backend.salts.random);
					
					// Mask time.
					if(expedition.fuzzyTime) moment(expedition.date).add(randomSeed.intBetween(-FUZZY_HOURS, FUZZY_HOURS), 'hours').minute(0).second(0).millisecond(0);
					
					// Mask location.
					let distance = [randomSeed.intBetween(-FUZZY_METERS, FUZZY_METERS), randomSeed.intBetween(-FUZZY_METERS, FUZZY_METERS)];
					let pi = Math.PI;
					let R = 6378137; // Earth’s radius
					let dLat = distance[0] / R;
					let dLng = distance[1] / ( R * Math.cos(pi * expedition.location[1] / 180) );
					expedition.location[0] = expedition.location[0] + ( dLat * 180 / pi );
					expedition.location[1] = expedition.location[1] + ( dLng * 180 / pi );
				}
				
				// Build profile.
				return Promise.resolve(dot.transform({
					'expedition._key': 'id',
					'expedition.title': 'title',
					'expedition.description': 'description',
					'expedition.date': 'date.isoString',
					'dateAccuracy': 'date.accuracy',
					'expedition.icon': 'icon',
					'expedition.needsApproval': 'needsApproval',
					'expedition.location': 'location.latLng',
					"locationAccuracy": "location.accuracy",
					"activity": "activity",
					'links': 'links',
					'owner': 'owner',
					'isOwner': 'relations.isOwned',
					'statistics.isApproved': 'relations.isApproved',
					'statistics.isAwaiting': 'relations.isAwaiting',
					'statistics.awaitingUsers': 'statistics.awaitingUsers',
					'statistics.approvedUsers': 'statistics.approvedUsers'
				}, {
					locationAccuracy: expedition.needsApproval ? ExpeditionController.FUZZY_METERS : 0,
					dateAccuracy: expedition.fuzzyTime ? ExpeditionController.FUZZY_HOURS * 3600 : 0,
					statistics: values[2],
					expedition: expedition,
					activity: values[3],
					links: links,
					owner: values[1],
					isOwner: values[0]._key == relatedUser._key
				}));
			});
		};
		let now = Date.now();
		let transformed = expedition instanceof Array ? Promise.all(expedition.map(createPublicExpedition)) : createPublicExpedition(expedition);
		return transformed.then((result: any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' expeditions' : '1 expedition'} took ${Date.now() - now} millis`);
			return result;
		});
	}
	
	export interface ExpeditionStatistics {
		approvedUsers: number;
		awaitingUsers: number;
		isApproved: boolean;
		isAwaiting: boolean;
	}
	
	export function getStatistics(expedition: Expedition, relatedUser: User) : Promise<ExpeditionStatistics> {
	/*	let aqlQuery = `LET expeditionApproved = (FOR approved IN INBOUND @expeditionId @@edgesUserFollowsActivity RETURN follower._id) LET lists = (FOR list IN INBOUND @activityId @@edgesListIsItem RETURN list._id) RETURN {isFollowed: LENGTH(INTERSECTION(activityFollowers, [@userId])) > 0, followers: LENGTH(activityFollowers), lists: LENGTH(lists)}`;
		let aqlParams = {
			'@edgesUserFollowsActivity': DatabaseManager.arangoCollections.userFollowsActivity.name,
			'@edgesListIsItem': DatabaseManager.arangoCollections.listIsItem.name,
			activityId: expedition._id,
			userId: relatedUser._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<ActivityStatistics>;
		TODO
		*/
		return Promise.resolve({
			approvedUsers: 3,
			awaitingUsers: 2,
			isApproved: false,
			isAwaiting: false
		});
	}
	
	export function findByUser(user: User, ownsOnly = false) : Promise<Expedition[]>{
		return DatabaseManager.arangoFunctions.outbounds(user._id, ownsOnly ? DatabaseManager.arangoCollections.userOwnsExpedition.name : DatabaseManager.arangoCollections.userJoinsExpedition.name);
	}
	
	export function findByKey(key: string | string[]): Promise<Expedition | Expedition[]> {
		let collection = DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.expeditions.name);
		return key instanceof Array ? collection.lookupByKeys(key) as Promise<Expedition[]> : collection.byExample({
			_key: key
		}, {
			limit: 1
		}).then(cursor => cursor.next()) as any as Promise<Expedition|Expedition[]>;
	}
	
	export function findByFulltext(query: string) : Promise<Expedition[]>{
		let aqlQuery = `FOR expedition IN FULLTEXT(@@collection, "title", @query) RETURN expedition`;
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.expeditions.name,
			query: query.split(' ').map(word => '|prefix:' + word).join()
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<Expedition[]>;
	}
	
	export function approveUser(expedition: Expedition, user: User) : Promise<UserJoinsExpedition> {
		let collection = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsActivity.name);
		return collection.byExample({
			_from: user._id,
			_to: expedition._id
		}, {
			limit: 1
		}).then((cursor: Cursor) => cursor.next() as any as UserJoinsExpedition).then((userJoinsExpedition: UserJoinsExpedition) => {
			// Try to edit any existing connection.
			if(userJoinsExpedition) {
				return userJoinsExpedition;
			}
			
			// Add connection.
			let edge : UserFollowsActivity = {
				_from: user._id,
				_to: expedition._id,
				createdAt: null,
				updatedAt: null
			};
			
			return DatabaseManager.arangoFunctions.updateOrCreate(edge, DatabaseManager.arangoCollections.userJoinsExpedition.name);
		});
	}
	
	export function rejectUser(activity: User, user: User): Promise<void> {
		let edge = {
			_from: user._id,
			_to: activity._id
		};
		return DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsActivity.name).removeByExample(edge).then(() => {});
	}
	
	export function removeExpeditions(activity: Activity): Promise<Activity> {
		return DatabaseManager.arangoFunctions.outbounds(activity._id, DatabaseManager.arangoCollections.expeditionIsItem.name).then((expeditions: Expedition[]) => {
			return Promise.all(expeditions.map(expedition => ExpeditionController.removeExpedition(expedition)));
		}).then(() => activity);
	}
	
	export function removeExpedition(expedition: Expedition): Promise<any> {
		let graph = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name);
		
		// Remove expedition.
		return graph.vertexCollection(DatabaseManager.arangoCollections.expeditions.name).remove(expedition._id);
	}
	
	export function create(recipe: ExpeditionRecipe) : Promise<Expedition> {
		let expedition: Expedition = {
			title: recipe.title,
			description: recipe.description,
			needsApproval: recipe.needsApproval,
			date: recipe.date,
			icon: recipe.icon,
			location: recipe.location,
			fuzzyTime: recipe.fuzzyTime,
			createdAt: null,
			updatedAt: null
		};
		return Promise.resolve(expedition);
	}
	
	export function save(expedition: Expedition): Promise<Expedition> {
		expedition.description = expedition.description.trim();
		expedition.title = expedition.title.trim();
		
		// Save.
		return DatabaseManager.arangoFunctions.updateOrCreate(expedition, DatabaseManager.arangoCollections.expeditions.name);
	}
	
	/**
	 * Changes the ownership of the expedition to a user.
	 * @param expedition
	 * @param owner
	 * @returns {Promise<any>|Promise<TResult|any>|Promise<TResult>|Promise<TResult2|TResult1>}
	 */
	export function setOwner(expedition: Expedition, owner: User): Promise<Expedition> {
		let graph = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name);
		let owns = graph.edgeCollection(DatabaseManager.arangoCollections.userOwnsExpedition.name);
		
		// Exists owner edge?
		return owns.byExample({
			_to: expedition._id
		}, {
			limit: 1
		}).then(cursor => cursor.next() as any as UserOwnsExpedition).then((edge: UserOwnsExpedition) => {
			// Create new edge?
			if(!edge) edge = {
				_to: expedition._id,
				_from: owner._id
			};
			
			// Update edge.
			edge._from = owner._id;
			return DatabaseManager.arangoFunctions.updateOrCreate(edge, DatabaseManager.arangoCollections.userOwnsExpedition.name);
		}).then(() => expedition);
	}
	
	export function getOwner(expedition: Expedition) : Promise<User> {
		return DatabaseManager.arangoFunctions.inbound(expedition._id, DatabaseManager.arangoCollections.userOwnsExpedition.name);
	}
	
	/**
	 * Changes the activity of the expedition.
	 * @param expedition
	 * @param activity
	 * @returns {Promise<any>|Promise<TResult|any>|Promise<TResult>|Promise<TResult2|TResult1>}
	 */
	export function setActivity(expedition: Expedition, activity: Activity): Promise<Expedition> {
		let graph = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name);
		let owns = graph.edgeCollection(DatabaseManager.arangoCollections.expeditionIsItem.name);
		
		// Exists owner edge?
		return owns.byExample({
			_from: expedition._id
		}, {
			limit: 1
		}).then(cursor => cursor.next() as any as ExpeditionIsItem).then((edge: ExpeditionIsItem) => {
			// Create new edge?
			if(!edge) edge = {
				_from: expedition._id,
				_to: activity._id
			};
			
			// Update edge.
			edge._to = activity._id;
			return DatabaseManager.arangoFunctions.updateOrCreate(edge, DatabaseManager.arangoCollections.expeditionIsItem.name);
		}).then(() => expedition);
	}
	
	export function getActivity(expedition: Expedition): Promise<Activity> {
		return DatabaseManager.arangoFunctions.outbound(expedition._id, DatabaseManager.arangoCollections.expeditionIsItem.name);
	}
	
	export function getNearbyExpeditions(user: User): Promise<Expedition[]> {
		let aqlQuery = `FOR doc IN NEAR(@@collection, @latitude, @longitude, @limit) RETURN doc`;
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.expeditions.name,
			latitude: user.location[0],
			longitude: user.location[1],
			limit: 10
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<Expedition[]>;
	}
	
	export namespace RouteHandlers {
		
		import getPublicExpedition = ExpeditionController.getPublicExpedition;
		/**
		 * Handles [POST] /api/expeditions/create
		 * @param request Request-Object
		 *
		 * @param request.payload.expedition.title title
		 * @param request.payload.expedition.description description
		 * @param request.payload.expedition.needsApproval needsApproval
		 * @param request.payload.expedition.date date
		 * @param request.payload.expedition.icon icon
		 * @param request.payload.expedition.location location
		 * @param request.payload.expedition.fuzzyTime fuzzyTime
		 * @param request.payload.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function create(request: any, reply: any): void {
			// Create promise.
			let promise: Promise<any> = ActivityController.findByKey(request.payload.activity).then((activity: Activity) => {
				if(!activity) return Promise.reject(Boom.badRequest('Activity does not exist!'));
				
				return ExpeditionController.create(request.payload.expedition).then((expedition: Expedition) => {
					return ExpeditionController.save(expedition);
				}).then((expedition: Expedition) => {
					return ExpeditionController.setOwner(expedition, request.auth.credentials);
				}).then((expedition: Expedition) => {
					return ExpeditionController.approveUser(expedition, request.auth.credentials).then(() => expedition);
				}).then((expedition: Expedition) => {
					return ExpeditionController.setActivity(expedition, activity);
				}).then((expedition: Expedition) => {
					return ExpeditionController.getPublicExpedition(expedition, request.auth.credentials);
				});
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/expeditions/=/{key}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function get(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<Expedition> = ExpeditionController.findByKey(request.params.key).then((expedition: Expedition) => {
				if (!expedition) return Promise.reject(Boom.notFound('Expedition not found.'));
				return ExpeditionController.getPublicExpedition(expedition, request.auth.credentials);
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/expeditions/like/{query}/{offset?}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.params.offset offset (optional, default=0)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function like(request: any, reply: any): void {
			// Create promise.
			//TODO slice
			let promise : Promise<Expedition[]> = ExpeditionController.findByFulltext(request.params.query).then((expeditions: Expedition[]) => ExpeditionController.getPublicExpedition(expeditions.slice(request.params.offset, request.params.offset + 30), request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/expeditions/by/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function by(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(request.params.username) : request.auth.credentials).then(user => {
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return ExpeditionController.findByUser(user);
			}).then((expeditions: Expedition[]) => getPublicExpedition(expeditions, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/expeditions/by/{username}/in/{activity}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.params.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		
		export function getActivityExpeditionsBy(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(request.params.username) : request.auth.credentials).then(user => {
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return ExpeditionController.findByUser(user);
			}).then((expeditions: Expedition[]) => getPublicExpedition(expeditions, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/expeditions/within/{radius}
		 * @param request Request-Object
		 * @param request.params.radius number
		 * @param request.params.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function nearby(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = ExpeditionController.getNearbyExpeditions(request.auth.credentials).then((expeditions: Expedition[]) => {
				return getPublicExpedition(expeditions, request.auth.credentials);
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/expeditions/within/{radius}/in/{activity}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.params.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getActivityExpeditionsNearby(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(request.params.username) : request.auth.credentials).then(user => {
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return ExpeditionController.findByUser(user);
			}).then((expeditions: Expedition[]) => getPublicExpedition(expeditions, request.auth.credentials));
			
			reply.api(promise);
		}
	}
}
