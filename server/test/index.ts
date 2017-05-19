/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
process.env.ENV = 'test';

import {TranslationsKeys} from '../app/models/Translations';
import {AuthController} from '../app/controllers/AuthController';
import {User, UserRoles} from "../app/models/user/User";
import {Config} from "../../run/config";
import {AccountController} from "../app/controllers/AccountController";
import * as faker from 'faker';
import * as shortid from 'shortid';
import * as _ from "lodash";

function generateUser(): User {
	let firstName = faker.name.firstName();
	let lastName = faker.name.lastName();
	let user: User = {
		id: shortid.generate(),
		firstName: firstName,
		lastName: lastName,
		username: faker.internet.userName(firstName, lastName),
		languages: _.sampleSize(TranslationsKeys),
		mails: {
			primary: {
				mail: faker.internet.email(firstName, lastName),
				verified: true
			},
			secondary: {
				mail: faker.internet.email(firstName, lastName),
				verified: true
			}
		},
		scope: [
			UserRoles.user
		],
		location: {
			lat: Number.parseFloat(faker.address.latitude()),
			lng: Number.parseFloat(faker.address.longitude())
		},
		hasAvatar: false,
		profileText: faker.lorem.sentences(2),
		onBoard: true,
		password: AuthController.hashPassword(faker.internet.password()),
		createdAt: faker.date.past().toISOString(),
		updatedAt: faker.date.past().toISOString(),
	};
	
	// Return.
	return user;
}

describe(`Testing ${Config.name}...`, () => {
	// Initialize server.
	before(() => {
		return require("../config/Hapi").hapiServer().then(() => {
		
		});
	});
	
	describe('test 1', () => {
		it('test 1 description', () => {});
	});
});
