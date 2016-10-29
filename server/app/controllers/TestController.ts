import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {User, UserRoles} from "../models/User";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import {Cursor} from "arangojs";
import casual = require('casual');
import {arangoCollections, DatabaseManager} from "../Database";

export module TestController {
	
	function generateUser(): User {
		return {
			firstName: casual.first_name,
			lastName: casual.last_name,
			username: casual.username,
			mails: [{
				mail: casual.email,
				verified: true
			}],
			scope: [
				UserRoles.user
			],
			location: [
				Number.parseFloat(casual.latitude),
				Number.parseFloat(casual.longitude)
			],
			meta: {
				hasAvatar: false,
				profileText: casual.short_description
			},
			auth: {
				password: casual.password,
				providers: [],
			},
			createdAt: casual.unix_time,
			updatedAt: casual.unix_time,
		};
	}
	
	
	/**
	 * Handles [GET] /api/test/truncate/{collection?}
	 * @param request Request-Object
	 * @param request.params.collection collection (optional
	 * @param reply Reply-Object
	 */
	export function truncate(request: any, reply: any): void {
		let collection = request.params.collection;
		let collections = [];
		if(collection && Object.keys(arangoCollections).reduce((found, currentCollection) => found || arangoCollections[currentCollection] == collection, false)) {
			collections.push(collection);
		} else if(!collection) {
			collections = collections.concat(Object.keys(arangoCollections).map(key => arangoCollections[key]))
		}
		
		// Truncate collection(s).
		let promise = Promise.all(collections.map(collectionName => {
			return DatabaseManager.arangoClient.collection(collectionName).truncate().then(() => collectionName)
		})).then((deletedCollections: Array<string>) => {
			if(deletedCollections.length == 0) return Promise.reject(Boom.badRequest('Collection not found!'));
			return Promise.resolve(`${deletedCollections.join(', ')} had been truncated!`);
		});
		reply.api(promise);
	}
	
	/**
	 * Handles [GET] /api/test/create-users
	 * @param request Request-Object
	 * @param request.param.count number of users
	 * @param reply Reply-Object
	 */
	export function createUsers(request: any, reply: any): void {
		// Prepare users.
		let aqlQuery = `FOR u IN @users INSERT u INTO @@collection`;
		let aqlParam = {
			'@collection': arangoCollections.users,
			users: (() => {
				let users = [];
				for(let i = 0; i < (request.params.count || 100); i++) users.push(generateUser());
				return users;
			})()
		};
		
		// Insert users.
		let promise = DatabaseManager.arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => cursor.all()).then(() => `${aqlParam.users.length} user(s) had been added!`);
		reply.api(promise);
	}
}
