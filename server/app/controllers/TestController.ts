import Nodemailer = require("nodemailer");
import Boom = require("boom");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import _ = require('lodash');
import {User, UserRoles} from "../models/user/User";
import {Cursor} from "arangojs";
import {DatabaseManager} from "../Database";
import {Activity} from "../models/activity/Activity";
import {UserController} from "./UserController";
import {UserFollowsUser} from "../models/user/UserFollowsUser";
import {AccountController} from "./AccountController";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import * as faker from 'faker';
import {Config} from "../../../run/config";

export module TestController {
	
	export function measureTime(prefix: string, treshold: number = 70) {
		let now = Date.now();
		return (input: any) => {
			let duration = Date.now() - now;
			if(duration >= treshold) console.log(prefix + ' ' + duration + ' ms');
			return input;
		}
	}
	
	function generateUser(): User {
		let date = [
			faker.date.past().toISOString(),
			faker.date.past().toISOString()
		].sort();
		let firstName = faker.name.firstName();
		let lastName = faker.name.lastName();
		 let user: User = {
			firstName: firstName,
			lastName: lastName,
			languages: [
				//TODO Dynamic languages
				'de',
			    'en'
			],
			username: faker.internet.userName(firstName, lastName).toLowerCase().replace(/[^0-9a-z_-]/, '-'),
			mails: [{
				mail: faker.internet.email(firstName, lastName),
				verified: true
			}],
			scope: [
				UserRoles.user
			],
			location: [
				Number.parseFloat(faker.address.latitude()),
				Number.parseFloat(faker.address.longitude())
			],
			meta: {
				hasAvatar: false,
				profileText: faker.lorem.sentences(2),
				fulltextSearchData: null,
				onBoard: true
			},
			auth: {
				password: faker.internet.password(),
				providers: [],
			},
			createdAt: date[0],
			updatedAt: date[1],
		};
		
		// Apply fulltext search data.
		AccountController.updateFulltextSearchData(user);
		
		// Return.
		return user;
	}
	
	function generateActivity(): Activity {
		let translations = ['de', 'en', 'fr', 'es'];
		let date = [
			faker.date.past().toISOString(),
			faker.date.past().toISOString()
		].sort();
		let activity : Activity = {
			defaultLocation: [
				Number.parseFloat(faker.address.latitude()),
				Number.parseFloat(faker.address.longitude())
			],
			translations: {},
			icon: faker.random.arrayElement(Object.keys(faker.random.objectElement<any>(Config.backend.icons).icons)),
			createdAt: date[0],
			updatedAt: date[1]
		};
		
		// Generate random translations.
		_.sampleSize(translations, Math.round(Math.random() * (translations.length - 1)) + 1).forEach(translation => {
			activity.translations[translation] = `${faker.lorem.words(Math.random() * 5 + 3)} (${translation})`;
		});
		
		return activity;
	}
	
	/**
	 * Handles [POST] /api/test/truncate/{collection?}
	 * @param request Request-Object
	 * @param request.params.collection collection (optional
	 * @param reply Reply-Object
	 */
	export function truncate(request: any, reply: any): void {
		let collection = request.params.collection;
		let collections = [];
		if(collection && Object.keys(DatabaseManager.arangoCollections).reduce((found, currentCollection) => found || DatabaseManager.arangoCollections[currentCollection].name == collection.name, false)) {
			collections.push(collection.name);
		} else if(!collection) {
			collections = collections.concat(Object.keys(DatabaseManager.arangoCollections).map(key => DatabaseManager.arangoCollections[key].name))
		}
		
		// Truncate collection(s).
		let promise = Promise.all(collections.map(collectionName => {
			return DatabaseManager.arangoClient.collection(collectionName).truncate().then(() => collectionName);
		})).then((deletedCollections: Array<string>) => {
			if(deletedCollections.length == 0) return Promise.reject(Boom.badRequest('Collection not found!'));
			return Promise.resolve(`${deletedCollections.join(', ')} had been truncated!`);
		});
		reply.api(promise);
	}
	
	/**
	 * Handles [POST /api/test/create-users/{count?}
	 * @param request Request-Object
	 * @param request.param.count number of users
	 * @param reply Reply-Object
	 */
	export function createUsers(request: any, reply: any): void {
		// Prepare users.
		let aqlQuery = `FOR u IN @users INSERT u INTO @@collection`;
		let aqlParam = {
			'@collection': DatabaseManager.arangoCollections.users.name,
			users: (() => {
				let users = [];
				for(let i = 0; i < (request.params.count || 100); i++) users.push(generateUser());
				return users;
			})()
		};
		
		// Insert users.
		let promise = DatabaseManager.arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => cursor.all()).then(() => `${aqlParam.users.length} users had been added!`);
		reply.api(promise);
	}
	
	/**
	 * Handles [POST] /api/test/create-activities/{count?)
	 * @param request Request-Object
	 * @param request.param.count number of activities
	 * @param reply Reply-Object
	 */
	export function createActivities(request: any, reply: any): void {
		// Prepare activities.
		let aqlQuery = `FOR a IN @activities INSERT a INTO @@collection`;
		let aqlParam = {
			'@collection': DatabaseManager.arangoCollections.activities.name,
			activities: (() => {
				let activities = [];
				for(let i = 0; i < (request.params.count || 100); i++) activities.push(generateActivity());
				return activities;
			})()
		};
		
		// Insert activities.
		let promise = DatabaseManager.arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => cursor.all()).then(() => `${aqlParam.activities.length} activities had been added!`);
		reply.api(promise);
	}
	
	/**
	 * Handles [POST] /api/test/create-user-follows-user/{count?}
	 * @param request Request-Object
	 * @param request.param.count number of max followers per user
	 * @param reply Reply-Object
	 */
	export function createUserFollowsUser(request: any, reply: any): void {
		// Prepare.
		let aqlQuery = `FOR u IN @@collection LET followers = (FOR f IN @@collection SORT RAND() FILTER f._key != u._key LIMIT @count RETURN f) RETURN {from: u, followers: followers}`;
		let aqlParam = {
			'@collection': DatabaseManager.arangoCollections.users.name,
			count : Number.parseInt(request.params.count) || 100
		};
		
		// Insert edges.
		let promise = DatabaseManager.arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => cursor.all()).then((result : any) => {
			let jobs : Array<Promise<UserFollowsUser>> = [];
			result.forEach((user: {
				from: User,
				followers: Array<User>
			}) => user.followers.forEach(follower => jobs.push(UserController.addUserConnection(user.from, follower))));
			return Promise.all(jobs).then(() => `Users randomly following users!`);
		});
		reply.api(promise);
	}
	
	/**
	 * Handles [POST] /api/test/create-user-follows-activity/{count?}
	 * @param request Request-Object
	 * @param request.param.count number of max activities per user
	 * @param reply Reply-Object
	 */
	export function createUserFollowsActivity(request: any, reply: any): void {
		// Prepare.
		let aqlQuery = `FOR u IN @user INSERT a INTO @@collection`;
		//TODO
		// Insert edges.
		let promise = DatabaseManager.arangoClient.query(aqlQuery).then((cursor: Cursor) => cursor.all()).then(() => `Users randomly following activities!`);
		reply.api(promise);
	}
}
