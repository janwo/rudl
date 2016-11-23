import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import * as CryptoJS from 'crypto-js';
import fs = require('fs');
import path = require('path');
import * as Joi from "joi";
import {Config} from "../../../run/config";
import {User, UserProvider, UserValidation, UserRoles} from "../models/users/User";
import {DatabaseManager, arangoCollections} from "../Database";
import jwt = require("jsonwebtoken");
import {Cursor} from "arangojs";
import _ = require("lodash");
import {UserController} from "./UserController";
import sharp = require("sharp");

export module AccountController {
	
	interface UserRecipe {
		username: string;
		mail: string;
		password?: string;
		firstName?: string;
		lastName?: string;
	}
	
	export function createUser(recipe: UserRecipe): Promise<User> {
		// Does user already exist?
		let promise = Promise.all([
			UserController.findByUsername(recipe.username).catch(() => null),
			UserController.findByMail(recipe.mail).catch(() => null)
		]).then((values: User[]) => {
			return new Promise((resolve, reject) => {
				if(values[0] || values[1]) {
					reject(Boom.badRequest('Cannot create user as the username or mail is already in use.'));
					return;
				}
				resolve();
			});
		});
		
		// Create user.
		promise = promise.then(() => {
			return {
				firstName: recipe.firstName ? recipe.firstName : null,
				lastName: recipe.lastName ? recipe.lastName : null,
				username: recipe.username,
				mails: [{mail: recipe.mail, verified: false}],
				scope: [UserRoles.user],
				location: null,
				meta: {
					hasAvatar: false,
					profileText: null
				},
				auth: {
					password: recipe.password,
					providers: []
				}
			};
		}).then((user: User) => setPassword(user, user.auth.password));
		
		return promise;
	}
	
	interface CheckUsernameResult {
		username: string;
		available: boolean;
		recommendations?: Array<string>
	}
	
	export function checkUsername(username: string): Promise<CheckUsernameResult> {
		//TODO The recommendation array does return strings greater than 16 chars.
		// Check validity.
		if (!Joi.validate(username, UserValidation.username)) return Promise.reject<CheckUsernameResult>(Boom.badRequest('Username has an invalid length or unexpected characters.'));
		
		let aqlQuery = `FOR u in @@collection FILTER REGEX_TEST(u.username, "^${username}[0-9]*$") RETURN u`;//TODO Bind Parameter?
		let aqlParams = {
			'@collection': arangoCollections.users
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
			user.auth.password = CryptoJS.AES.encrypt(password, Config.backend.secretPassphrase).toString();
			resolve(user);
		});
	}
	
	export function checkPassword(user: User, password: string): Promise<User> {
		return new Promise<User>((resolve, reject) => {
			let decrypted = CryptoJS.AES.decrypt(user.auth.password, Config.backend.secretPassphrase).toString(CryptoJS.enc.Utf8);
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
			return resolve(save ? saveUser(user) : user);
		});
	}
	
	export function removeProvider(user: User, provider: UserProvider, save: boolean = false): Promise<User> {
		return new Promise<User>(resolve => {
			let existingProviderIndex: number = user.auth.providers.findIndex(elem => elem.provider === provider.provider && elem.userIdentifier === provider.userIdentifier);
			if (existingProviderIndex >= 0) user.auth.providers.splice(existingProviderIndex, 1);
			return resolve(save ? saveUser(user) : user);
		});
	}
	
	export function saveUser(user: User): Promise<User> {
		// Set new timestamps.
		let now = Math.trunc(Date.now() / 1000);
		user.updatedAt = now;
		if (!user._key) user.createdAt = now;
		
		let aqlQuery = user._key ?
			`REPLACE @document IN @@collection RETURN NEW` :
			`INSERT @document INTO @@collection RETURN NEW`;
		let aqlParams = {
			'@collection': arangoCollections.users,
			document: user
		};
		
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next());
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
				if (request.payload.file) {
					let uploadDir = path.resolve(Config.backend.uploads.dir, 'avatars/');
					let small = fs.createWriteStream(path.resolve(uploadDir, user._key + '-small'));
					let medium = fs.createWriteStream(path.resolve(uploadDir, user._key + '-medium'));
					let large = fs.createWriteStream(path.resolve(uploadDir, user._key + '-large'));
					
					let transformations = new sharp(undefined, undefined);//TODO use update sharp.d.ts as soon as available
					transformations.clone().resize(100, 100).max().crop(sharp.strategy.entropy).toFormat('png').pipe(small).on('error', reject);
					transformations.clone().resize(450, 450).max().crop(sharp.strategy.entropy).toFormat('png').pipe(medium).on('error', reject);
					transformations.clone().resize(800, 800).max().crop(sharp.strategy.entropy).toFormat('png').pipe(large).on('error', reject);
					
					request.payload.file.pipe(transformations);
					request.payload.file.on('error', reject);
					request.payload.file.on('end', () => {
						user.meta.hasAvatar = true;
						resolve(saveUser(user));
					});
					return;
				}
				
				reject(Boom.badData('Missing file payload.'));
			}).catch(err => {
				request.log(err);
				return Promise.reject(Boom.badImplementation('An server error occurred! Please try again.'))
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
