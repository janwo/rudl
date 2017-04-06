/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
process.env.ENV = 'test';

import {DatabaseManager} from "../app/Database";
import {Cursor} from "arangojs";
import {User, UserRoles} from "../app/models/users/User";
import {Config} from "../../run/config";
import {AccountController} from "../app/controllers/AccountController";
import * as faker from 'faker';

function generateUser(): User {
	let firstName = faker.name.firstName();
	let lastName = faker.name.lastName();
	let user: User = {
		firstName: firstName,
		lastName: lastName,
		username: faker.internet.userName(firstName, lastName),
		languages: [
			//TODO: Dynamic languages
			'de',
		    'en'
		],
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
		createdAt: faker.date.past().toISOString(),
		updatedAt: faker.date.past().toISOString(),
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
