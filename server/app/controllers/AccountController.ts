
import * as Boom from "boom";
import * as Path from 'path';
import * as CryptoJS from "crypto-js";
import * as Joi from "joi";
import {Config} from "../../../run/config";
import {User, UserProvider, UserValidation, UserRoles} from "../models/user/User";
import {DatabaseManager} from "../Database";
import {Cursor} from "arangojs";
import {UserController} from "./UserController";
import * as sharp from "sharp";

export module AccountController {
	
	interface UserRecipe {
		username: string;
		mail: string;
		password?: string;
		firstName: string;
		lastName: string;
	}
	
	//TODO ERROR HANDLING FOR USERNAME OR MAIL COLLISION
	export function createUser(recipe: UserRecipe): Promise<User> {
		return new Promise<User>(resolve => {
			// Does user already exist?
			let promise = Promise.all([
				UserController.findByUsername(recipe.username),
				UserController.findByMail(recipe.mail)
			]).then((values: User[]) => {
				if(values[0] || values[1]) return Promise.reject<User>('Cannot create user as the username or mail is already in use.');
			
				// Create user.
				return {
					firstName: recipe.firstName ,
					lastName: recipe.lastName,
					username: recipe.username,
					mails: [
						{
							mail: recipe.mail,
							verified: false
						}
					],
					scope: [UserRoles.user],
					location: null,
					languages: [
						//TODO: dynamic language
						'de',
						'en'
					],
					meta: {
						hasAvatar: false,
						profileText: null,
						fulltextSearchData: null,
						onBoard: false
					},
					auth: {
						password: recipe.password,
						providers: []
					},
					createdAt: null,
					updatedAt: null
				};
			});
			
			// Create user.
			promise.then((user: User) => setPassword(user, user.auth.password)).then(resolve);
		});
		
	}
	
	interface CheckUsernameResult {
		username: string;
		available: boolean;
		recommendations?: Array<string>
	}
	
	//TODO GET RID OF BOOM HERE
	export function checkUsername(username: string): Promise<CheckUsernameResult> {
		//TODO The recommendation array does return strings greater than 16 chars.
		// Check validity.
		if (!Joi.validate(username, UserValidation.username)) return Promise.reject<CheckUsernameResult>(Boom.badRequest('Username has an invalid length or unexpected characters.'));
		
		let aqlQuery = `FOR u in @@collection FILTER REGEX_TEST(u.username, "^${username}[0-9]*$") RETURN u`;//TODO Bind Parameter?
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.users.name
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.map((user: User) => user.username)).then((takenUsernames: Array<string>) => {
			let usernameCheckResult: any = {
				username: username,
				available: takenUsernames.length == 0 || takenUsernames.indexOf(username) < 0
			};
			
			if (!usernameCheckResult.available) {
				// Add recommendations.
				usernameCheckResult.recommendations = [];
				
				let pad = (num: number) => {
					let padNum: string = num.toString();
					while (padNum.length < 2) padNum = "0" + padNum;
					return padNum;
				};
				
				/*
				 Method 1 - Append a number.
				 Method 2 - Append a number with pad.
				 */
				let methods = [
					`${username}#`,
					`${username}##`
				];
				methods.forEach(method => {
					let counter: number = 2;
					while (true) {
						let suggestion = method.replace('##', pad(counter)).replace('#', counter.toString());
						if (takenUsernames.indexOf(suggestion) < 0) {
							usernameCheckResult.recommendations.push(suggestion);
							break;
						}
						counter++;
					}
				});
			}
			
			return usernameCheckResult;
		});
	}
	
	export function setPassword(user: User, password: string): Promise<User> {
		return new Promise<User>(resolve => {
			user.auth.password = CryptoJS.AES.encrypt(password, Config.backend.salts.password).toString();
			resolve(user);
		});
	}
	
	// TODO GET RID OF BOOM HERE
	export function checkPassword(user: User, password: string): Promise<User> {
		return new Promise<User>((resolve, reject) => {
			let decrypted = CryptoJS.AES.decrypt(user.auth.password, Config.backend.salts.password).toString(CryptoJS.enc.Utf8);
			if(password !== decrypted) {
				reject(Boom.badRequest('Combination of username and password does not match.'));
				return;
			}
			
			resolve(user);
		});
	}
	
	export function addProvider(user: User, provider: UserProvider, save: boolean = false): Promise<User> {
		return new Promise<User>(resolve => {
			let existingProviderIndex: number = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
			if (existingProviderIndex >= 0)
				user.auth.providers[existingProviderIndex] = provider;
			else
				user.auth.providers.push(provider);
			return resolve(save ? AccountController.save(user) : user);
		});
	}
	
	export function removeProvider(user: User, provider: UserProvider, save: boolean = false): Promise<User> {
		return new Promise<User>(resolve => {
			let existingProviderIndex: number = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
			if (existingProviderIndex >= 0) user.auth.providers.splice(existingProviderIndex, 1);
			return resolve(save ? AccountController.save(user) : user);
		});
	}
	
	export function updateFulltextSearchData(user: User) {
		user.meta.fulltextSearchData = [
			user.username,
			user.firstName,
			user.lastName
		].join(' ');
	}
	
	export function save(user: User): Promise<User> {
		// Redefine search data.
		updateFulltextSearchData(user);
		
		// Create.
		return DatabaseManager.arangoFunctions.updateOrCreate(user, DatabaseManager.arangoCollections.users.name);
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
					return AccountController.save(user);
				}).then((user: User) => UserController.getPublicUser(user, user));
				
				resolve(promise);
			}).catch(err => {
				// Log + forward error.
				request.log(err);
				return Promise.reject(Boom.badImplementation('An server error occurred! Please try again.'))
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/account/location
		 * @param request Request-Object
		 * @param request.payload.longitude longitude
		 * @param request.payload.latitude latitude
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function updateLocation(request: any, reply: any): void {
			// Update location.
			request.auth.credentials.location = [
				request.payload.latitude,
				request.payload.longitude
			];
			
			// Save user.
			let promise = AccountController.save(request.auth.credentials).then((user: User) => {
				return UserController.getPublicUser(user, user);
			});
			
			reply.api(promise);
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
			request.auth.credentials.meta.onBoard = request.payload.boarded;
			
			// Save user.
			let promise = AccountController.save(request.auth.credentials).then((user: User) => {
				return UserController.getPublicUser(user, user);
			});
			
			reply.api(promise);
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
