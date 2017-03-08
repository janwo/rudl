/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
process.env.ENV = 'test';

import {DatabaseManager} from "../app/Database";
import {Cursor} from "arangojs";
import {User, UserRoles} from "../app/models/users/User";
import {Config} from "../../run/config";
import {AccountController} from "../app/controllers/AccountController";
import casual = require('casual');

function generateUser(): User {
	let user: User = {
		firstName: casual.first_name,
		lastName: casual.last_name,
		username: casual.username,
		languages: [
			//TODO: Dynamic languages
			'de',
		    'en'
		],
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
			profileText: casual.short_description,
			fulltextSearchData: null
		},
		auth: {
			password: casual.password,
			providers: [],
		},
		createdAt: casual.date('YYYY-MM-DD HH:MM:SS.MMM'),
		updatedAt: casual.date('YYYY-MM-DD HH:MM:SS.MMM'),
	};
	
	// Apply fulltext search data.
	AccountController.updateFulltextSearchData(user);
	
	// Return.
	return user;
}

describe(`Testing ${Config.name}...`, () => {
	// Initialize server.
	before(() => {
		return require("../config/Hapi").hapiServer().then(() => {
			// Truncate.
			DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.users.name).truncate();
			DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.userFollowsUser.name).truncate();
			DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.activities.name).truncate();
			
			// Add users.
			let aqlQuery = `FOR u IN @users INSERT u INTO @@collection`;
			let aqlParam = {
				'@collection': DatabaseManager.arangoCollections.users,
				users: (() => {
					let users = [];
					for(let i = 0; i < 100; i++) users.push(generateUser());
					return users;
				})()
			};
			DatabaseManager.arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => cursor.all());
		});
	});
	
	describe('test 1', () => {
		it('test 1 description', () => {});
	});
});
