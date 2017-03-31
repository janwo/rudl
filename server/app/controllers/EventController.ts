import Nodemailer = require("nodemailer");
import Boom = require("boom");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {DatabaseManager} from "../Database";
import {Cursor} from "arangojs";
import {Activity} from "../models/activities/Activity";
import {User} from "../models/users/User";
import {Event} from "../models/events/Event";
import {UserController} from "./UserController";
import {UserFollowsActivity} from "../models/activities/UserFollowsActivity";
import {UserOwnsEvent} from "../models/events/UserOwnsEvent";
import {UserJoinsEvent} from "../models/events/UserJoinsEvent";
import {EventIsItem} from "../models/events/EventIsItem";
import {ActivityController} from "./ActivityController";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import * as moment from "moment";
import _ = require("lodash");

export module EventController {
	
	export const FUZZY_HOURS = 3;
	export const FUZZY_METERS = 1000;
	
	export function getPublicEvent(event: Event | Event[], relatedUser: User) : Promise<any> {
		let createPublicEvent = (event: Event) : Promise<any> => {
			let eventOwnerPromise = getEventOwner(event);
			let publicEventOwnerPromise = eventOwnerPromise.then((owner: User) => {
				return UserController.getPublicUser(owner, relatedUser);
			});
			let eventStatisticsPromise = getEventStatistics(event, relatedUser);
			
			return Promise.all([
				eventOwnerPromise,
				publicEventOwnerPromise,
				eventStatisticsPromise
			]).then((values: [User, any, EventStatistics]) => {
				// Add default links.
				let links = {};
				
				// Mask data for unapproved users.
				if(!values[2].isApproved) {
					// Mask time.
					if(event.fuzzyTime) moment(event.date).add(Math.random() * FUZZY_HOURS * 2 - FUZZY_HOURS, 'hours').minute(0).second(0).millisecond(0);
					
					// Mask location.
					let distance = [Math.random() * 2000 - 1000, Math.random() * 2000 - 1000];
					let pi = Math.PI;
					let R = 6378137; // Earth’s radius
					let dLat = distance[0] / R;
					let dLng = distance[1] / ( R * Math.cos(pi * event.location[1] / 180) );
					event.location[0] = event.location[0] + ( dLat * 180 / pi );
					event.location[1] = event.location[1] + ( dLng * 180 / pi );
				}
				
				// Build profile.
				return Promise.resolve(dot.transform({
					'event._key': 'id',
					'event.title': 'title',
					'event.description': 'description',
					'event.fuzzyTime': 'fuzzyTime',
					'event.date': 'date',
					'event.needsApproval': 'needsApproval',
					'event.location': 'location',
					'links': 'links',
					'owner': 'owner',
					'isOwner': 'relations.isOwned',
					'statistics.isApproved': 'relations.isApproved',
					'statistics.isAwaiting': 'relations.isAwaiting',
					'statistics.awaitingUsers': 'statistics.awaitingUsers',
					'statistics.approvedUsers': 'statistics.approvedUsers'
				}, {
					statistics: values[2],
					event: event,
					links: links,
					owner: values[1],
					isOwner: values[0]._key == relatedUser._key
				}));
			});
		};
		let now = Date.now();
		let transformed = event instanceof Array ? Promise.all(event.map(createPublicEvent)) : createPublicEvent(event);
		return transformed.then((result: any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' events' : '1 event'} took ${Date.now() - now} millis`);
			return result;
		});
	}
	
	export interface EventStatistics {
		approvedUsers: number;
		awaitingUsers: number;
		isApproved: boolean;
		isAwaiting: boolean;
	}
	
	export function getEventStatistics(event: Event, relatedUser: User) : Promise<EventStatistics> {
	/*	let aqlQuery = `LET eventApproved = (FOR approved IN INBOUND @eventId @@edgesUserFollowsActivity RETURN follower._id) LET lists = (FOR list IN INBOUND @activityId @@edgesListIsItem RETURN list._id) RETURN {isFollowed: LENGTH(INTERSECTION(activityFollowers, [@userId])) > 0, followers: LENGTH(activityFollowers), lists: LENGTH(lists)}`;
		let aqlParams = {
			'@edgesUserFollowsActivity': DatabaseManager.arangoCollections.userFollowsActivity.name,
			'@edgesListIsItem': DatabaseManager.arangoCollections.listIsItem.name,
			activityId: event._id,
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
	
	export function findByUser(user: User, ownsOnly = false) : Promise<Event[]>{
		let aqlQuery = `FOR event IN OUTBOUND @user @@edges RETURN event`;
		let aqlParams = {
			'@edges': ownsOnly ? DatabaseManager.arangoCollections.userOwnsEvent.name : DatabaseManager.arangoCollections.userJoinsEvent.name,
			user: user._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<Event[]>;
	}
	
	export function findByKey(key: string) : Promise<Event>{
		let aqlQuery = `FOR event IN @@collection FILTER event._key == @key RETURN event`;
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.events.name,
			key: key
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<Event>;
	}
	
	export function findByFulltext(query: string) : Promise<Event[]>{
		//TODO use languages of user
		let aqlQuery = `FOR event IN FULLTEXT(@@collection, "title", @query) RETURN activity`;
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.activities.name,
			query: query.split(' ').map(word => '|prefix:' + word).join()
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<Event[]>;
	}
	
	export function getEventOwner(event: Event) : Promise<User> {
		let aqlQuery = `FOR owner IN INBOUND @eventId @@userOwnsEvent RETURN owner`;
		let aqlParams = {
			'@userOwnsEvent': DatabaseManager.arangoCollections.userOwnsEvent.name,
			eventId: event._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<User>;
	}
	
	export function approveUser(event: Event, user: User) : Promise<UserFollowsActivity> {
		let collection = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsActivity.name);
		return collection.firstExample({
			_from: user._id,
			_to: event._id
		}).then((cursor: Cursor) => cursor.next()).then((userFollowsActivity: UserFollowsActivity) => {
			// Try to return any existing connection.
			if(userFollowsActivity) return userFollowsActivity;
			
			// Add connection.
			let now = new Date().toISOString();
			let edge : UserFollowsActivity = {
				_from: user._id,
				_to: event._id,
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
	
	export function createEvent(user: User, activity: Activity, options: {
		title: string,
		description: string,
		needsApproval: boolean,
		date: string,
		fuzzyTime: boolean,
		location: number[]
	}) : Promise<Event> {
		let now = new Date().toISOString();
		let event : Event = {
			title: options.title,
			description: options.description,
			needsApproval: options.needsApproval,
			date: options.date,
			location: options.location,
			fuzzyTime: options.fuzzyTime,
			createdAt: now,
			updatedAt: now
		};
		// TODO Change to vertexCollection, see bug https://github.com/arangodb/arangojs/issues/354
		return DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.events.name).save(event).then((event: Event) => {
			let userOwnsEvent : UserOwnsEvent = {
				_from: user._id,
				_to: event._id,
				createdAt: now,
				updatedAt: now
			};
			
			let userJoinsEvent : UserJoinsEvent = {
				_from: user._id,
				_to: event._id,
				createdAt: now,
				updatedAt: now,
				approved: true
			};
			
			let eventIsItem : EventIsItem = {
				_from: event._id,
				_to: activity._id,
				createdAt: now,
				updatedAt: now
			};
			
			return Promise.all([
				DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.eventIsItem.name).save(eventIsItem),
				DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userOwnsEvent.name).save(userOwnsEvent),
				DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userJoinsEvent.name).save(userJoinsEvent)
			]).then(() => event);
		});
	}
	
	export namespace RouteHandlers {
		
		import getPublicEvent = EventController.getPublicEvent;
		/**
		 * Handles [POST] /api/events/create
		 * @param request Request-Object
		 * @param request.payload.title title
		 * @param request.payload.description description
		 * @param request.payload.needsApproval needsApproval
		 * @param request.payload.date date
		 * @param request.payload.location location
		 * @param request.payload.fuzzyTime fuzzyTime
		 * @param request.payload.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function createEvent(request: any, reply: any): void {
			// Create promise.
			let promise: Promise<any> = ActivityController.findByKey(request.payload.activity).then((activity: Activity) => {
				if(activity) return EventController.createEvent(request.auth.credentials, activity, {
					title: request.payload.title,
					description: request.payload.description,
					needsApproval: request.payload.needsApproval,
					date: request.payload.date,
					location: request.payload.location,
					fuzzyTime: request.payload.fuzzyTime
				}).then(event => EventController.getPublicEvent(event, request.auth.credentials));
				
				return Promise.reject(Boom.badRequest('Activity does not exist!'));
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/events/=/{key}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getEvent(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<Event> = EventController.findByKey(request.params.key).then((event: Event) => EventController.getPublicEvent(event, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/events/like/{query}/{offset?}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.params.offset offset (optional, default=0)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getEventsLike(request: any, reply: any): void {
			// Create promise.
			//TODO slice
			let promise : Promise<Event[]> = EventController.findByFulltext(request.params.query).then((events: Event[]) => EventController.getPublicEvent(events.slice(request.params.offset, request.params.offset + 30), request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/events/by/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getEventsBy(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(request.params.username) : request.auth.credentials).then(user => {
				if(user) return EventController.findByUser(user);
				return Promise.reject(Boom.notFound('User not found!'));
			}).then((events: Event[]) => getPublicEvent(events, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/events/by/{username}/in/{activity}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.params.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getActivityEventsBy(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(request.params.username) : request.auth.credentials).then(user => {
				if(user) return EventController.findByUser(user);
				return Promise.reject(Boom.notFound('User not found!'));
			}).then((events: Event[]) => getPublicEvent(events, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/events/within/{radius}
		 * @param request Request-Object
		 * @param request.params.radius number
		 * @param request.params.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getEventsNearby(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(request.params.username) : request.auth.credentials).then(user => {
				if(user) return EventController.findByUser(user);
				return Promise.reject(Boom.notFound('User not found!'));
			}).then((events: Event[]) => getPublicEvent(events, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/events/within/{radius}/in/{activity}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.params.activity activity
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getActivityEventsNearby(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(request.params.username) : request.auth.credentials).then(user => {
				if(user) return EventController.findByUser(user);
				return Promise.reject(Boom.notFound('User not found!'));
			}).then((events: Event[]) => getPublicEvent(events, request.auth.credentials));
			
			reply.api(promise);
		}
	}
}
