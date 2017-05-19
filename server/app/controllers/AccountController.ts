import * as Boom from "boom";
import * as Path from 'path';
import {Config} from "../../../run/config";
import {User, UserRoles} from "../models/user/User";
import {DatabaseManager, TransactionSession} from "../Database";
import {UserController} from "./UserController";
import * as sharp from "sharp";
import Transaction from "neo4j-driver/lib/v1/transaction";
import {AuthController} from './AuthController';
import Result from 'neo4j-driver/lib/v1/result';

export module AccountController {
	
	interface UserRecipe {
		id: string;
		username: string;
		mail: string;
		password?: string;
		firstName: string;
		lastName: string;
	}
	
	export function create(transaction: Transaction, recipe: UserRecipe): Promise<User> {
		return Promise.all([
			UserController.findByUsername(transaction, recipe.username),
			UserController.findByMail(transaction, recipe.mail)
		]).then((values: User[]) => {
			if(values[0] || values[1]) return transaction.rollback().then(() => {
				return Promise.reject<User>('Cannot create user as the username or mail is already in use.');
			});
		
			// Create user.
			let user: User = {
				firstName: recipe.firstName ,
				lastName: recipe.lastName,
				username: recipe.username,
				id: recipe.id,
				scope: [UserRoles.user],
				location: {
					lng: null,
					lat: null
				},
				languages: [
					//TODO: dynamic language
					'de',
					'en'
				],
				hasAvatar: false,
				profileText: null,
				onBoard: false,
				mails: {
					primary: {
						mail: recipe.mail,
						verified: false
					},
					secondary: {
						mail: recipe.mail,
						verified: false
					}
				},
				password: AuthController.hashPassword(recipe.password),
				createdAt: null,
				updatedAt: null
			};
			return this.save(transaction, user).then(() => user);
		});
	}
	
	export function availableUsername(transaction: Transaction, username: string): Promise<string> {
		let pad = (num: number) => {
			let padNum: string = num.toString();
			while (padNum.length < 2) padNum = "0" + padNum;
			return padNum;
		};
		
		let nextAvailableUsername = (username: string, suffix: number = 0): Promise<string> => {
			let fullUsername = suffix > 0 ? username + pad(suffix) : username;
			return UserController.findByUsername(transaction, fullUsername).then((user: User) => {
				return user ? nextAvailableUsername(username, suffix + 1) : fullUsername;
			});
		};
		
		return nextAvailableUsername(username);
	}
	
	export function save(transaction: Transaction, user: User): Promise<void> {
		// Set timestamps.
		let now = new Date().toISOString();
		if(!user.createdAt) user.createdAt = now;
		user.updatedAt = now;
		
		// Save.
		return transaction.run("MERGE (u:User { username: $user.username }) ON CREATE SET u = $flattenUser ON MATCH SET u = $flattenUser", {
			user: user,
			flattenUser: DatabaseManager.neo4jFunctions.flatten(user)
		}).then(() => {});
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [POST] /api/account/avatar
		 * @param request Request-Object
		 * @param request.payload.file uploaded avatar file
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function uploadAvatar(request: any, reply: any): void {
			let user = request.auth.credentials;
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = new Promise((resolve, reject) => {
				if (!request.payload.filename) {
					reject(Boom.badData('Missing file payload.'));
					return;
				}
				
				// Create sharp instance.
				let transformer = sharp().png();
				request.payload.filename.pipe(transformer);
				
				// Make paths retrievable.
				let getAvatarPath = (size: string) => Path.resolve(Config.paths.avatars.dir, `${user._key}-${size}`);
				
				// Set transformation streams.
				let transformations = [
					transformer.clone().resize(100, 100).max().crop(sharp.strategy.entropy).toFile(getAvatarPath('small')),
					transformer.clone().resize(450, 450).max().crop(sharp.strategy.entropy).toFile(getAvatarPath('medium')),
					transformer.clone().resize(800, 800).max().crop(sharp.strategy.entropy).toFile(getAvatarPath('large'))
				];
				
				// Execute transformations, update and return user profile.
				let promise = Promise.all(transformations).then(() => {
					user.meta.hasAvatar = true;
					return AccountController.save(transaction, user).then(() => {
						return UserController.getPublicUser(transaction, user, user);
					});
				}).catch((err: any) => {
					// Log + forward error.
					request.log(err);
					return Promise.reject(Boom.badImplementation('An server error occurred! Please try again.'));
				});
				
				resolve(promise);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/account/location
		 * @param request Request-Object
		 * @param request.payload.lng longitude
		 * @param request.payload.lat latitude
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function updateLocation(request: any, reply: any): void {
			// Update location.
			let user = request.auth.credentials;
			
			user.location = {
				lat: request.payload.lat,
				lng: request.payload.lng
			};
			
			// Save user.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = AccountController.save(transaction, user).then(() => {
				return UserController.getPublicUser(transaction, user, user);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/account/boarding
		 * @param request Request-Object
		 * @param request.payload.boarded boarded
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function updateBoarding(request: any, reply: any): void {
			// Update location.
			let user = request.auth.credentials;
			user.onBoard = request.payload.boarded;
			
			// Save user.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = AccountController.save(transaction, user).then(() => {
				return UserController.getPublicUser(transaction, user, user);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/account/check-username/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param reply Reply-Object
		 */
		export function checkUsername(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = AccountController.availableUsername(transaction, request.params.username).then((username: string) => {
				let obj: any = {
					available: request.params.username == username,
				};
				if(!obj.available) obj.suggestion = username;
				return obj;
			});
			
			reply.api(promise, transactionSession);
		}
	}
}

/*
 var smtpTransport = Nodemailer.createTransport(Config.mailer.options);
 request.server.render('templates/reset-password-email', {
 name: user.displayName,
 appName: Config.app.title,
 url: 'http://' + request.headers.host + '/auth/reset/' + token
 }, function (err, emailHTML) {
 
 var mailOptions = {
 to: user.email,
 from: Config.mailer.from,
 subject: 'Password Reset',
 html: emailHTML
 };
 smtpTransport.sendMail(mailOptions, function (err) {
 
 if (!err) {
 reply({message: 'An email has been sent to ' + user.email + ' with further instructions.'});
 } else {
 return reply(Boom.badRequest('Failure sending email'));
 }
 
 done(err);
 });
 });
 },
 */

/*
 function (user, done) {
 request.server.render('templates/reset-password-confirm-email', {
 name: user.displayName,
 appName: Config.app.title
 }, function (err, emailHTML) {
 var mailOptions = {
 to: user.email,
 from: Config.mailer.from,
 subject: 'Your password has been changed',
 html: emailHTML
 };
 
 smtpTransport.sendMail(mailOptions, function (err) {
 done(err, 'done');
 });
 });
 */
