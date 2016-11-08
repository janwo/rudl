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
import {List} from "../models/lists/List";
import {Activity} from "../models/activities/Activity";
import {UserController} from "./UserController";
import {User} from "../models/users/User";
import {ListController} from "./ListController";

export module ActivityController {
	
	export function getPublicActivity(activity: Activity | Activity[]) {
		let transform = activity => {
			// Add default links.
			let links = {
			};
			
			// Build profile.
			return Promise.resolve(dot.transform({
				'activity._key': 'id',
				'activity.name': 'name',
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
	
	export function getActivitiesIn(list: List, countOnly: boolean = false) : Promise<Activity[] | number>{
		let aqlQuery = `FOR activity IN OUTBOUND @list @@edges ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN activity'}`;
		let aqlParams = {
			'@edges': arangoCollections.listIsItem,
			list: list
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all());
	}
	
	export function getActivitiesBy(user: User, countOnly: boolean = false) : Promise<Activity[] | number>{
		let aqlQuery = `FOR activity IN OUTBOUND @user @@edges ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN activity'}`;
		let aqlParams = {
			'@edges': arangoCollections.userFollowsActivity,
			user: user
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all());
	}
	
	export function getActivity(key: string) : Promise<Activity>{
		let aqlQuery = `FOR activity IN @@collection FILTER activity._key == @key RETURN activity`;
		let aqlParams = {
			'@collection': arangoCollections.activities,
			key: key
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next());
	}
	
	export function getActivitiesLike(query: string, countOnly: boolean = false) : Promise<Activity[] | number>{
		let aqlQuery = `FOR activity IN FULLTEXT(@@collection, "name", @query) ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN activity'}`;
		let aqlParams = {
			'@collection': arangoCollections.activities,
			query: query.split(' ').map(word => '|' + word).join()
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all());
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [GET] /api/activities/in/{list}
		 * @param request Request-Object
		 * @param request.params.list list
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getActivitiesIn(request: any, reply: any): void {
			let paramList = encodeURIComponent(request.params.list);
			
			// Create promise.
			let promise : Promise<List> = ListController.getList(paramList).then(ActivityController.getActivitiesIn).then((activities: Activity[]) => {
				return getPublicActivity(activities);
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
			let promise : Promise<Activity> = ActivityController.getActivity(paramKey).then(getPublicActivity);
			
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
			let promise : Promise<Activity[]> = ActivityController.getActivitiesLike(paramQuery).then((activities: Activity[]) => getPublicActivity(activities));
			
			reply.api(promise);
		}
	}
}
