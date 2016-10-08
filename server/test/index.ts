process.env.NODE_ENV = 'test';

import {arangoClient, arangoCollections} from "../config/Database";
import {Cursor} from "arangojs";
import {User, UserRoles} from "../app/models/User";
import casual = require('casual');
import {Config} from "../config/Config";

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
		hasAvatar: false,
		meta: {},
		auth: {
			password: casual.password,
			providers: [],
		},
		createdAt: casual.unix_time,
		updatedAt: casual.unix_time,
	};
}

describe(`Testing ${Config.app.title}...`, () => {
	// Initialize server.
	before(() => {
		return require("../config/Hapi").hapiServer().then(() => {
			// Truncate.
			arangoClient.collection(arangoCollections.users).truncate();
			arangoClient.collection(arangoCollections.userConnections).truncate();
			arangoClient.collection(arangoCollections.activities).truncate();
			
			// Add users.
			let aqlQuery = `FOR u IN @users INSERT u INTO @@collection`;
			let aqlParam = {
				'@collection': arangoCollections.users,
				users: (() => {
					let users = [];
					for(let i = 0; i < 100; i++) users.push(generateUser());
					return users;
				})()
			};
			arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => cursor.all());
		});
	});
	
	describe('test 1', () => {
		it('test 1 description', () => {});
	});
});
