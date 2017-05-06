import {DatabaseManager} from "../Database";
import {Cursor} from "arangojs";
import {UserController} from "./UserController";
import {AccountController} from "./AccountController";
import {User} from "../models/user/User";
import {Activity} from '../models/activity/Activity';
import {ActivityController} from './ActivityController';
import {Expedition} from '../models/expedition/Expedition';

export module SuggestionController {
	
	export function getPeopleSuggestions(user: User): Promise<User[]> {
		let aqlQuery = `LET notIn = UNION([@user], FOR e IN @@edges FILTER e._from == @user RETURN e._to) FOR u IN @@collection FILTER u._id NOT IN notIn LIMIT 5 RETURN u`;
		let aqlParams = {
			'@edges': DatabaseManager.arangoCollections.userFollowsUser.name,
			'@collection': DatabaseManager.arangoCollections.users.name,
			user: user._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all());
	}
	
	export function getActivitySuggestions(user: User): Promise<Activity[]> {
		let aqlQuery = `FOR expedition IN NEAR(@@expeditions, @latitude, @longitude, @limit)
		FOR edge IN @@expeditionIsItem FILTER edge._from == expedition._id COLLECT activities = edge._to
		RETURN DOCUMENT(activities)`;
		let aqlParams = {
			'@expeditions': DatabaseManager.arangoCollections.expeditions.name,
			'@expeditionIsItem': DatabaseManager.arangoCollections.expeditionIsItem.name,
			latitude: user.location[0],
			longitude: user.location[1],
			limit: 10
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<Activity[]>;
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [GET] /api/suggestions/people
		 * @param request Request-Object
		 * @param reply Reply-Object
		 */
		export function getPeopleSuggestions(request: any, reply: any): void {
			let promise = SuggestionController.getPeopleSuggestions(request.auth.credentials).then((users: User[]) => UserController.getPublicUser(users, request.auth.credentials));
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/suggestions/activities
		 * @param request Request-Object
		 * @param reply Reply-Object
		 */
		export function getActivitySuggestions(request: any, reply: any): void {
			let promise = SuggestionController.getActivitySuggestions(request.auth.credentials).then((activities: Activity[]) => {
				return ActivityController.getPublicActivity(activities, request.auth.credentials)
			});
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/suggestions/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param reply Reply-Object
		 */
		export function checkUsername(request: any, reply: any): void {
			let promise = new Promise(resolve => {
				// Check validity.
				resolve(AccountController.checkUsername(request.params.username));
			});
			
			reply.api(promise);
		}
	}
}
