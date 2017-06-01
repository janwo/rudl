import * as Boom from 'boom';
import * as Path from 'path';
import {Config} from '../../../run/config';
import {User, UserRoles} from '../models/user/User';
import {DatabaseManager, TransactionSession} from '../Database';
import {UserController} from './UserController';
import * as sharp from 'sharp';
import Transaction from 'neo4j-driver/lib/v1/transaction';
import {AuthController} from './AuthController';
import * as shortid from 'shortid';
import * as fs from 'fs';

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
			if (values[0] || values[1]) return transaction.rollback().then(() => {
				return Promise.reject<User>('Cannot create user as the username or mail is already in use.');
			});
			
			// Create user.
			let user: User = {
				firstName: recipe.firstName,
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
				avatarId: null,
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
		if (!user.createdAt) user.createdAt = now;
		user.updatedAt = now;
		
		// Save.
		return transaction.run("MERGE (u:User { username: $user.username }) ON CREATE SET u = $flattenUser ON MATCH SET u = $flattenUser", {
			user: user,
			flattenUser: DatabaseManager.neo4jFunctions.flatten(user)
		}).then(() => {});
	}
	
	export enum AvatarSizes {
		small, medium, large
	}
	
	export function getAvatarPath(user: User, size: AvatarSizes, salt: string = null): string {
		let targetSize = 'small';
		switch(size) {
			case AvatarSizes.medium:
				targetSize = 'medium';
				break;
			case AvatarSizes.large:
				targetSize = 'large';
				break;
		}
		return Path.resolve(Config.paths.avatars.dir, `${user.id}-${targetSize}-${salt ? salt : user.avatarId}`);
	}
	
	export function getAvatarLink(user: User, size: AvatarSizes = AvatarSizes.small, salt: string = null): string {
		let targetSize = 'small';
		switch(size) {
			case AvatarSizes.medium:
				targetSize = 'medium';
				break;
			case AvatarSizes.large:
				targetSize = 'large';
				break;
		}
		return `${Config.backend.domain + Config.paths.avatars.publicPath + user.id}-${targetSize}-${salt ? salt : user.avatarId}`;
	}
	
	export namespace RouteHandlers {
		/**
		 * Handles [POST] /api/account/delete-avatar
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function deleteAvatar(request: any, reply: any): void {
			let user: User = request.auth.credentials;
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = new Promise(resolve => {
				// Has no avatar? Done!
				if(!user.avatarId) return resolve();
				
				let unlinkOldAvatars = [
					AvatarSizes.small,
					AvatarSizes.medium,
					AvatarSizes.large
				].map(size => new Promise((resolve, reject) => {
					let path = AccountController.getAvatarPath(user, size);
					fs.exists(path, exists => {
						if(!exists) resolve();
						fs.unlink(path, err => {
							if(err) reject(err);
							resolve();
						});
					});
				}));
				let promise = Promise.all(unlinkOldAvatars).then(() => {
					user.avatarId = null;
					return AccountController.save(transaction, user).then(() => {
						return UserController.getPublicUser(transaction, user, user);
					});
				});
				resolve(promise);
			});
			
			reply.api(promise, transactionSession);
		}
		
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
				if (!request.payload.file) {
					reject(Boom.badData('Missing file payload.'));
					return;
				}
				
				// Create sharp instance.
				let transformer = sharp().png();
				request.payload.file.pipe(transformer);
				
				// Make paths retrievable.
				let newSalt = shortid.generate();
				let oldSalt = user.avatarId;
				let sizes = [
					{
						name: AvatarSizes.small,
						size: 100
					},
					{
						name: AvatarSizes.medium,
						size: 450
					},
					{
						name: AvatarSizes.large,
						size: 800
					}
				];
				
				// Set transformation streams.
				let createNewAvatars = sizes.map(size => {
					return transformer.clone().resize(size.size, size.size).max().crop(sharp.strategy.entropy).toFile(AccountController.getAvatarPath(user, size.name, newSalt))
				});
				
				// Execute transformations, update and return user profile.
				let promise = Promise.all(createNewAvatars).then(() => {
					let unlinkOldAvatars = oldSalt ? sizes.map(size => {
						return new Promise((resolve, reject) => {
							let path = AccountController.getAvatarPath(user, size.name, oldSalt);
							fs.exists(path, exists => {
								if(!exists) resolve();
								fs.unlink(path, err => {
									if(err) reject(err);
									resolve();
								});
							});
						});
					}) : [];
					return Promise.all(unlinkOldAvatars).then(() => {
						user.avatarId = newSalt;
						return AccountController.save(transaction, user).then(() => {
							return UserController.getPublicUser(transaction, user, user);
						});
					});
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
					available: request.params.username == username
				};
				if (!obj.available) obj.suggestion = username;
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
