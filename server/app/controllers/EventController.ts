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
import {Event} from "../models/events/Event";
import {UserController} from "./UserController";
import {UserFollowsActivity} from "../models/activities/UserFollowsActivity";
import {UserOwnsEvent} from "../models/events/UserOwnsEvent";
import {UserJoinsEvent} from "../models/events/UserJoinsEvent";
import {EventIsItem} from "../models/events/EventIsItem";
import {ActivityController} from "./ActivityController";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import _ = require("lodash");

export module EventController {
	
	export function getPublicEvent(event: Event | Event[], relatedUser: User) : Promise<any> {
		let createPublicEvent = (event: Event) : Promise<any> => {
		/*	return Promise.all([
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
					activity: event,
					links: links,
					owner: values[1],
					isOwner: values[0]._key == relatedUser._key
				}));
			});			*/
			return Promise.resolve({});
		};
		let now = Date.now();
		let transformed = event instanceof Array ? Promise.all(event.map(createPublicEvent)) : createPublicEvent(event);
		return transformed.then((result: any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' events' : '1 event'} took ${Date.now() - now} millis`);
			return result;
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
	
	export function createEvent(user: User, activity: Activity, options: {
		title: string,
		description: string,
		needsApproval: boolean,
		slots: number,
		date: string,
		fuzzyDate: boolean,
		location: number[]
	}) : Promise<Event> {
		let now = new Date().toISOString();
		let event : Event = {
			title: options.title,
			description: options.description,
			needsApproval: options.needsApproval,
			slots: options.slots,
			date: options.date,
			location: options.location,
			fuzzyDate: options.fuzzyDate,
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
		 * @param request.payload.slots slots
		 * @param request.payload.date date
		 * @param request.payload.location location
		 * @param request.payload.fuzzyDate fuzzyDate
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
					slots: request.payload.slots,
					date: request.payload.date,
					location: request.payload.location,
					fuzzyDate: request.payload.fuzzyDate
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
		 * @param request.params.key key
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
	}
}
