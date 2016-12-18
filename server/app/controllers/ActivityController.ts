import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {DatabaseManager, arangoCollections} from "../Database";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import {Cursor} from "arangojs";
import _ = require("lodash");
import {Activity} from "../models/activities/Activity";
import {User} from "../models/users/User";
import {UserRatedActivity} from "../models/users/UserRatedActivity";

export module ActivityController {
	
	export function getPublicActivity(activity: Activity | Activity[]) : Promise<any> {
		let transform = activity => {
			// Add default links.
			let links = {
			};
			
			// Build profile.
			return Promise.resolve(dot.transform({
				'activity._key': 'id',
				'activity.translations': 'translations',
				'activity.owner': 'owner',
				'activity.followedByYou': 'followedByYou',
				'activity': 'links'
			}, {
				activity: activity,
				links: links
			}));
		};

		return activity instanceof Array ? Promise.all(activity.map(transform)) : transform(activity);
	}
	
	export function setRating(user: User, activity: Activity, rating: number) : Promise<Activity>{
		let collection = DatabaseManager.arangoClient.collection(arangoCollections.userRatedActivity);
		
		switch(rating) {
			case 0:
				// Remove edge.
				return collection.removeByExample({
					_from: user._id,
					_to: activity._id
				}).then(() => activity);
			
			default:
				// Create edge.
				let now = Date.now();
				return collection.byExample({
					_from: user._id,
					_to: activity._id
				}).then(cursor => cursor.next() as any as UserRatedActivity).then((userRatedActivity : UserRatedActivity) => {
					userRatedActivity = userRatedActivity || {
							_from: user._id,
							_to: activity._id,
							createdAt: now,
							rating: rating,
							updatedAt: now
						};
					userRatedActivity.updatedAt = now;
					userRatedActivity.rating = rating;
					return userRatedActivity;
				}).then(document => collection.save(document)).then(() => activity);
		}
	}
	
	export function getRating(user: User, activity: Activity) : Promise<number>{
		let collection = DatabaseManager.arangoClient.collection(arangoCollections.userRatedActivity);
		return collection.byExample({
			_from: user._id,
			_to: activity._id
		}).then(cursor => cursor.next() as any as UserRatedActivity).then((userRatedActivity : UserRatedActivity) => userRatedActivity ? userRatedActivity.rating : 0);
	}
	
	export function getActivitiesBy(user: User, countOnly: boolean = false) : Promise<Activity[] | number>{
		let aqlQuery = `FOR activity IN OUTBOUND @user @@edges ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN activity'}`;
		let aqlParams = {
			'@edges': arangoCollections.userFollowsActivity,
			user: user._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all()) as any as Promise<Activity[] | number>;
	}
	
	export function getActivity(key: string) : Promise<Activity>{
		let aqlQuery = `FOR activity IN @@collection FILTER activity._key == @key RETURN activity`;
		let aqlParams = {
			'@collection': arangoCollections.activities,
			key: key
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<Activity>;
	}
	
	export function getActivitiesLike(query: string, countOnly: boolean = false) : Promise<Activity[] | number>{
		let aqlQuery = `FOR activity IN FULLTEXT(@@collection, "name", @query) ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN activity'}`;
		let aqlParams = {
			'@collection': arangoCollections.activities,
			query: query.split(' ').map(word => '|' + word).join()
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all()) as any as Promise<Activity[] | number>;
	}
	
	export namespace RouteHandlers {
		
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
			let promise : Promise<Activity> = ActivityController.getActivity(request.payload.activity).then((activity: Activity) => ActivityController.setRating(request.auth.credentials, activity, request.payload.rating)).then((activity: Activity) => {
				return ActivityController.getPublicActivity(activity);
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
			let paramKey = encodeURIComponent(request.params.key);
			
			// Create promise.
			let promise : Promise<Activity> = ActivityController.getActivity(paramKey).then((activity: Activity) => ActivityController.getPublicActivity(activity));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/activities/like/{query}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getActivitiesLike(request: any, reply: any): void {
			let paramQuery = encodeURIComponent(request.params.query);
			
			// Create promise.
			let promise : Promise<Activity[]> = ActivityController.getActivitiesLike(paramQuery).then((activities: Activity[]) => ActivityController.getPublicActivity(activities));
			
			reply.api(promise);
		}
	}
}
