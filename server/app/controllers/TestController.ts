import * as _ from 'lodash';
import {User, UserRoles} from '../models/user/User';
import {DatabaseManager, TransactionSession} from '../Database';
import {Rudel} from '../models/rudel/Rudel';
import * as faker from 'faker';
import {Config} from '../../../run/config';
import {AuthController} from './AuthController';
import {StatementResult} from 'neo4j-driver/types/v1/result';
import {TranslationsKeys} from '../models/Translations';
import * as shortid from 'shortid';

export module TestController {
	
	export function generateUser(): User {
		let firstName = faker.name.firstName();
		let lastName = faker.name.lastName();
		let date: number[] = [
			faker.date.past().getTime() / 1000,
			faker.date.past().getTime() / 1000
		].sort();
		
		// Return.
		return {
			id: shortid.generate(),
			firstName: firstName,
			lastName: lastName,
			languages: _.sampleSize(TranslationsKeys),
			username: faker.internet.userName(firstName, lastName).toLowerCase().replace(/[^0-9a-z_]/, '_'),
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
				latitude: Number.parseFloat(faker.address.latitude()),
				longitude: Number.parseFloat(faker.address.longitude())
			},
			avatarId: null,
			onBoard: true,
			profileText: faker.lorem.sentences(2),
			password: AuthController.hashPassword(faker.internet.password()),
			createdAt: date[0],
			updatedAt: date[1]
		};
	}
	
	export function generateRudel(): Rudel {
		let translations: string[] = ['de', 'en', 'fr', 'es'];
		let date: number[] = [
			faker.date.past().getTime() / 1000,
			faker.date.past().getTime() / 1000
		].sort();
		let rudel: Rudel = {
			id: shortid.generate(),
			translations: {},
			icon: faker.random.arrayElement(Object.keys(faker.random.objectElement<any>(Config.backend.icons).icons)),
			createdAt: date[0],
			updatedAt: date[1]
		};
		
		// Generate random translations.
		_.sampleSize(translations, Math.round(Math.random() * (translations.length - 1)) + 1).forEach((translation: string) => {
			rudel.translations[translation] = `${faker.lorem.words(Math.random() * 5 + 3)} (${translation})`;
		});
		
		return rudel;
	}
	
	export namespace RouteHandlers {
		/**
		 * Handles [POST /api/test/create-users/{count?}
		 * @param request Request-Object
		 * @param request.params.count number of users
		 * @param reply Reply-Object
		 */
		export function createUsers(request: any, reply: any): void {
			// Prepare users.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			
			let users: User[] = [];
			for (let i = 0; i < (request.params.count || 100); i++) {
				let singleUser = DatabaseManager.neo4jFunctions.flatten(TestController.generateUser());
				users.push(singleUser);
			}
			
			let promise = transaction.run(`FOREACH(x IN $users | MERGE (u:User {username: x.username }) SET u = x)`, {
				users: users
			}).then(() => users);
			
			// Insert users.
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/test/create-rudel/{count?)
		 * @param request Request-Object
		 * @param request.params.count number of rudel
		 * @param reply Reply-Object
		 */
		export function createRudel(request: any, reply: any): void {
			// Prepare rudel.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = transaction.run(`FOREACH(x IN $rudel | MERGE (r:Rudel {id: x.id }) SET r = x)`, {
				rudel: (() => {
					let rudel = [];
					for (let i = 0; i < (request.params.count || 100); i++) {
						let singleRudel = DatabaseManager.neo4jFunctions.flatten(TestController.generateRudel());
						rudel.push(singleRudel);
					}
					return rudel;
				})()
			}).then(() => `${request.params.count} rudel had been added!`);
			
			// Insert users.
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/test/create-user-follows-user/{probability?}
		 * @param request Request-Object
		 * @param request.params.probability probability a user follows another user
		 * @param reply Reply-Object
		 */
		export function createUserFollowsUser(request: any, reply: any): void {
			// Prepare.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = transaction.run("MATCH (u1:User), (u2:User) WITH u1, u2 WHERE rand() < $probability AND u1 <> u2 " +
				"MERGE (u1)-[:LIKES_USER]->(u2)", {
				probability: request.params.probability / 100
			}).then(() => `Users randomly follow ~${request.params.probability}% of all users!`);
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/test/create-user-follows-rudel/{probability?}
		 * @param request Request-Object
		 * @param request.params.probability probability a user follows a rudel
		 * @param reply Reply-Object
		 */
		export function createUserFollowsRudel(request: any, reply: any): void {
			// Prepare.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = transaction.run("MATCH (u:User), (r:Rudel) WITH u1, r WHERE rand() < $probability " +
				"MERGE (u)-[:LIKES_RUDEL]->(r)", {
				probability: request.params.probability / 100
			}).then(() => `Users randomly follow ~${request.params.probability}% of all rudel!`);
			
			reply.api(promise, transactionSession);
		}
	}
}
