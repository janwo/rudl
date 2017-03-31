import Nodemailer = require("nodemailer");
import Boom = require("boom");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {DatabaseManager} from "../Database";
import {Cursor} from "arangojs";
import {UserController} from "./UserController";
import {AccountController} from "./AccountController";
import {User} from "../models/users/User";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import _ = require("lodash");

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
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [GET] /api/suggestions/people
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param reply Reply-Object
		 */
		export function getPeopleSuggestions(request: any, reply: any): void {
			let promise = SuggestionController.getPeopleSuggestions(request.auth.credentials).then((users: User[]) => UserController.getPublicUser(users, request.auth.credentials));
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/suggestions/username
		 * @param request Request-Object
		 * @param reply Reply-Object
		 */
		export function checkUsername(request: any, reply: any): void {
			let promise = new Promise(resolve => {
				// Check validity.
				resolve(AccountController.checkUsername(request.payload.username));
			});
			
			reply.api(promise);
		}
	}
}
