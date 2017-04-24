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

export module ExpeditionController {
	
	export const FUZZY_HOURS = 3;
	export const FUZZY_METERS = 1000;
	
	export function getPublicExpedition(expedition: Expedition | Expedition[], relatedUser: User) : Promise<any> {
		let createPublicExpedition = (expedition: Expedition) : Promise<any> => {
			let expeditionOwnerPromise = getExpeditionOwner(expedition);
			let publicExpeditionOwnerPromise = expeditionOwnerPromise.then((owner: User) => {
				return UserController.getPublicUser(owner, relatedUser);
			});
			let expeditionStatisticsPromise = getExpeditionStatistics(expedition, relatedUser);
			
			return Promise.all([
				expeditionOwnerPromise,
				publicExpeditionOwnerPromise,
				expeditionStatisticsPromise
			]).then((values: [User, any, ExpeditionStatistics]) => {
				// Add default links.
				let links = {
					icon: UtilController.getIconUrl(expedition.icon)
				};
				
				// Mask data for unapproved users.
				if(!values[2].isApproved) {
					// Mask time.
					if(expedition.fuzzyTime) moment(expedition.date).add(Math.random() * FUZZY_HOURS * 2 - FUZZY_HOURS, 'hours').minute(0).second(0).millisecond(0);
					
					// Mask location.
					let distance = [Math.random() * 2000 - 1000, Math.random() * 2000 - 1000];
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
					'expedition.fuzzyTime': 'fuzzyTime',
					'expedition.date': 'date',
					'expedition.icon': 'icon',
					'expedition.needsApproval': 'needsApproval',
					'expedition.location': 'location',
					'links': 'links',
					'owner': 'owner',
					'isOwner': 'relations.isOwned',
					'statistics.isApproved': 'relations.isApproved',
					'statistics.isAwaiting': 'relations.isAwaiting',
					'statistics.awaitingUsers': 'statistics.awaitingUsers',
					'statistics.approvedUsers': 'statistics.approvedUsers'
				}, {
					statistics: values[2],
					expedition: expedition,
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
	
	export function getExpeditionStatistics(expedition: Expedition, relatedUser: User) : Promise<ExpeditionStatistics> {
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
		let aqlQuery = `FOR expedition IN OUTBOUND @user @@edges RETURN expedition`;
		let aqlParams = {
			'@edges': ownsOnly ? DatabaseManager.arangoCollections.userOwnsExpedition.name : DatabaseManager.arangoCollections.userJoinsExpedition.name,
			user: user._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<Expedition[]>;
	}
	
	export function findByKey(key: string) : Promise<Expedition>{
		let aqlQuery = `FOR expedition IN @@collection FILTER expedition._key == @key RETURN expedition`;
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.expeditions.name,
			key: key
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<Expedition>;
	}
	
	export function findByFulltext(query: string) : Promise<Expedition[]>{
		//TODO use languages of user
		let aqlQuery = `FOR expedition IN FULLTEXT(@@collection, "title", @query) RETURN activity`;
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.activities.name,
			query: query.split(' ').map(word => '|prefix:' + word).join()
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<Expedition[]>;
	}
	
	export function getExpeditionOwner(expedition: Expedition) : Promise<User> {
		let aqlQuery = `FOR owner IN INBOUND @expeditionId @@userOwnsExpedition RETURN owner`;
		let aqlParams = {
			'@userOwnsExpedition': DatabaseManager.arangoCollections.userOwnsExpedition.name,
			expeditionId: expedition._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<User>;
	}
	
	export function approveUser(expedition: Expedition, user: User) : Promise<UserFollowsActivity> {
		let collection = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsActivity.name);
		return collection.byExample({
			_from: user._id,
			_to: expedition._id
		}, {
			limit: 1
		}).then((cursor: Cursor) => cursor.next() as any as UserFollowsActivity).then((userFollowsActivity: UserFollowsActivity) => {
			// Try to return any existing connection.
			if(userFollowsActivity) return userFollowsActivity;
			
			// Add connection.
			let now = new Date().toISOString();
			let edge : UserFollowsActivity = {
				_from: user._id,
				_to: expedition._id,
				createdAt: now,
				updatedAt: now
			};
			
			return collection.save(edge);
		});
	}
	
	export function requestApproval(activity: User, user: User): Promise<void> {
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
		
		// TODO Remove all comments.
		
		// Remove expedition.
		return graph.vertexCollection(DatabaseManager.arangoCollections.expeditions.name).remove(expedition._id);
	}
	
	export function createExpedition(user: User, activity: Activity, options: {
		title: string,
		description: string,
		needsApproval: boolean,
		date: string,
		icon: string,
		fuzzyTime: boolean,
		location: number[]
	}) : Promise<Expedition> {
		let now = new Date().toISOString();
		let expedition : Expedition = {
			title: options.title,
			description: options.description,
			needsApproval: options.needsApproval,
			date: options.date,
			icon: options.icon,
			location: options.location,
			fuzzyTime: options.fuzzyTime,
			createdAt: now,
			updatedAt: now
		};
		// TODO Change to vertexCollection, see bug https://github.com/arangodb/arangojs/issues/354
		return DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.expeditions.name).save(expedition, true).then(expedition => expedition.new).then((expedition: Expedition) => {
			let userOwnsExpedition : UserOwnsExpedition = {
				_from: user._id,
				_to: expedition._id,
				createdAt: now,
				updatedAt: now
			};
			
			let userJoinsExpedition : UserJoinsExpedition = {
				_from: user._id,
				_to: expedition._id,
				createdAt: now,
				updatedAt: now,
				approved: true
			};
			
			let expeditionIsItem : ExpeditionIsItem = {
				_from: expedition._id,
				_to: activity._id,
				createdAt: now,
				updatedAt: now
			};
			
			return Promise.all([
				DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.expeditionIsItem.name).save(expeditionIsItem),
				DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userOwnsExpedition.name).save(userOwnsExpedition),
				DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userJoinsExpedition.name).save(userJoinsExpedition)
			]).then(() => expedition);
		});
	}
	
	export namespace RouteHandlers {
		
		import getPublicExpedition = ExpeditionController.getPublicExpedition;
		/**
		 * Handles [POST] /api/expeditions/create
		 * @param request Request-Object
		 * @param request.payload.title title
		 * @param request.payload.description description
		 * @param request.payload.needsApproval needsApproval
		 * @param request.payload.date date
		 * @param request.payload.icon icon
		 * @param request.payload.location location
		 * @param request.payload.fuzzyTime fuzzyTime
		 * @param request.payload.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function createExpedition(request: any, reply: any): void {
			// Create promise.
			let promise: Promise<any> = ActivityController.findByKey(request.payload.activity).then((activity: Activity) => {
				if(!activity) return Promise.reject(Boom.badRequest('Activity does not exist!'));
				
				return ExpeditionController.createExpedition(request.auth.credentials, activity, {
					title: request.payload.title,
					description: request.payload.description,
					needsApproval: request.payload.needsApproval,
					date: request.payload.date,
					icon: request.payload.icon,
					location: request.payload.location,
					fuzzyTime: request.payload.fuzzyTime
				}).then(expedition => ExpeditionController.getPublicExpedition(expedition, request.auth.credentials));
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
		export function getExpedition(request: any, reply: any): void {
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
		export function getExpeditionsLike(request: any, reply: any): void {
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
		export function getExpeditionBy(request: any, reply: any): void {
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
		export function getExpeditionsNearby(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(request.params.username) : request.auth.credentials).then(user => {
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return ExpeditionController.findByUser(user);
			}).then((expeditions: Expedition[]) => getPublicExpedition(expeditions, request.auth.credentials));
			
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
