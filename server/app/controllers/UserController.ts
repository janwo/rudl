import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {Config} from "../../../run/config";
import {User, UserProvider} from "../models/users/User";
import {DatabaseManager, arangoCollections} from "../Database";
import {DecodedToken} from "../models/Token";
import jwt = require("jsonwebtoken");
import {Cursor} from "arangojs";
import _ = require("lodash");
import {UserFollowsUser} from "../models/users/UserFollowsUser";
import {ActivityController} from "./ActivityController";
import {ListController} from "./ListController";
import {AuthController} from "./AuthController";

export module UserController {
	
	export function findByProvider(provider: UserProvider): Promise<User> {
		let aqlQuery = `FOR u IN @@collection FOR p IN u.auth.providers FILTER p.provider == @provider && p.userIdentifier == @userIdentifier RETURN u`;
		let aqlParams = {
			'@collection': arangoCollections.users,
			provider: provider.provider,
			userIdentifier: provider.userIdentifier
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next() as any as User).then((user: User) => {
			return new Promise<User>((resolve, reject) => {
				// No user found?
				if (user === undefined) {
					reject(Boom.notFound('User not found.'));
					return;
				}
				resolve(user);
			});
		});
	}
	
	export function findByUsername(username: string): Promise<User> {
		let aqlQuery = `FOR u IN @@collection FILTER u.username == @username LIMIT 1 RETURN u`;
		let aqlParams = {
			'@collection': arangoCollections.users,
			username: username
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next() as any as User).then((user: User) => {
			return new Promise<User>((resolve, reject) => {
				// No user found?
				if (user === undefined) {
					reject(Boom.notFound('User not found.'));
					return;
				}
				resolve(user);
			});
		});
	}
	
	export function findByMail(mail: string): Promise<User> {
		let aqlQuery = `FOR u IN @@collection FOR m IN u.mail FILTER m.mail == @mail && m.verified == true LIMIT 1 RETURN u`;
		let aqlParams = {
			'@collection': arangoCollections.users,
			mail: mail
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next() as any as User).then((user: User) => {
			return new Promise<User>((resolve, reject) => {
				// No user found?
				if (user === undefined) {
					reject(Boom.notFound('User not found.'));
					return;
				}
				resolve(user);
			});
		});
	}
	
	export function findByToken(token: DecodedToken): Promise<User> {
		return AuthController.getTokenData(token).then(() => {
			// Search for user.
			let aqlQuery = `FOR u IN @@collection FILTER u._key == @key LIMIT 1 RETURN u`;
			let aqlParams = {
				'@collection': arangoCollections.users,
				key: token.userId
			};
			return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next() as any as User).then((user: User) => {
				return new Promise<User>((resolve, reject) => {
					// No user found?
					if (user === undefined) {
						reject(Boom.notFound('User not found.'));
						return;
					}
					resolve(user);
				});
			});
		});
	}
	
	export function getPublicUser(user: User | User[], relatedUser: User): Promise<any> {
		let createPublicUser = user => {
			let lookups = [];
			
			// Add statistics.
			lookups.push(Promise.all([
				getUserConnections(user, null, true),
				getUserConnections(null, user, true),
				ListController.getListsBy(user, true),
				ActivityController.getActivitiesBy(user, true)
			]).then((values: Array<any>) => {
				return {
					statistics: {
						followees: values[0],
						followers: values[1],
						lists: values[2],
						activities: values[3]
					}
				};
			}));
			
			// Add relations.
			if(relatedUser._key != user._key) lookups.push(Promise.all<number>([
				getUserConnections(relatedUser, user, true),
				getUserConnections(user, relatedUser, true),
				getMutualConnections([user, relatedUser], false, true),
				getMutualConnections([user, relatedUser], true, true)
			]).then((values: Array<number>) => {
				return {
					relations: {
						followee: values[0] > 0,
						follower: values[1] > 0,
						mutual_followees: values[2],
						mutual_followers: values[3]
						//TODO mutual_activities, mutual_lists
					}
				};
			}));
			
			// Run lookups.
			return Promise.all<User>(lookups).then((values: Array<any>) => {
				return _.assign.apply(this, [user].concat(values))
			}).then(user => {
				// Define default links.
				let links = {
					followers: `${Config.backend.exposedHost}/api/users/${user.username}/followers`,
					followees: `${Config.backend.exposedHost}/api/users/${user.username}/following`
				};
				
				// Define avatar links?
				if(user.meta.hasAvatar) {
					links['avatars'] = {
						small: `${Config.backend.exposedHost}/static/avatars/${user._key}-small`,
						medium: `${Config.backend.exposedHost}/static/avatars/${user._key}-medium`,
						large: `${Config.backend.exposedHost}/static/avatars/${user._key}-large`
					};
				}
				
				// Build profile.
				return dot.transform({
					'user._key': 'id',
					'user.username': 'username',
					'user.firstName': 'firstName',
					'user.lastName': 'lastName',
					'user.meta.hasAvatar': 'meta.hasAvatar',
					'user.meta.profileText': 'meta.profileText',
					'user.statistics': 'statistics',
					'user.relations': 'relations',
					'user.languages': 'languages',
					'links': 'links',
					'user.createdAt': 'createdAt',
				}, {
					user: user,
					links: links
				});
			});
		};
		
		let now = Date.now();
		let transformed = user instanceof Array ? Promise.all(user.map(createPublicUser)) : createPublicUser(user);
		return transformed.then((result : any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' users' : '1 user'} took ${Date.now() - now} millis`);
			return result;
		});
	}
	
	export function getUserConnections(from: User, to: User, countOnly: boolean = false) : Promise<User[] | number> {
		if(!from && !to) throw('Invalid arguments: At least one argument has to be an user.');
		let aqlQuery = from && to ?
			`FOR u IN OUTBOUND @from @@edges FILTER u._id == @to LIMIT 1 ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN u'}` :
			`FOR u IN ${from ? 'OUTBOUND' : 'INBOUND'} @from @@edges ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN u'}`;
		let aqlParam = {
			'@edges': arangoCollections.userFollowsUser
		};
		if(from && to) aqlParam['to'] = to._id;
		aqlParam['from'] = from ? from._id : to._id;
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => countOnly ? cursor.next(): cursor.all()) as any as Promise<User[] | number>;
	}
	
	export function addUserConnection(user: User, aimedUser: User) : Promise<UserFollowsUser> {
		if(aimedUser._id === user._id) return Promise.reject<UserFollowsUser>(Boom.badRequest('Users cannot follow themselves.'));
		
		let now = Math.trunc(Date.now() / 1000);
		let edge : UserFollowsUser = {
			_from: user._id,
			_to: aimedUser._id,
			createdAt: now,
			updatedAt: now
		};
	
		let aqlQuery = `INSERT @document INTO @@edges RETURN NEW`;
		let aqlParams = {
			'@edges': arangoCollections.userFollowsUser,
			document: edge
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<UserFollowsUser>;
	}
	
	export function removeUserConnection(user: User, aimedUser: User): Promise<void> {
		let aqlQuery = `FOR e IN @@edges FILTER e._from == @from && e._to == @to REMOVE e IN @@edges`;
		let aqlParams = {
			'@edges': arangoCollections.userFollowsUser,
			from: user._id,
			to: aimedUser._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then(() => {});
	}
	
	export function getMutualConnections(users: User[], inbound = true, countOnly: boolean = false): Promise<User[] | number> {
		if(!users || users.length < 2) throw('Invalid arguments: At least choose two users for mutual comparison.');
		let friendsOfUser = users.map((user: User, index: number) => `(FOR v IN ${inbound ? 'INBOUND' : 'OUTBOUND'} @user_${index} @@edges RETURN v._id)`).join(',');
		let aqlQuery = `FOR u IN INTERSECTION (${friendsOfUser}) ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN u'}`;
		let aqlParam = {
			'@edges': arangoCollections.userFollowsUser
		};
		users.forEach((user: User, index: number) => {
			aqlParam[`user_${index}`] = user._id;
		});
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all()) as any as Promise<User[] | number>;
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [GET] /api/users/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param reply Reply-Object
		 */
		export function getUser(request: any, reply: any): void {
			let paramUsername = encodeURIComponent(request.params.username);
			let promise : Promise<User> = Promise.resolve(paramUsername != 'me' ? findByUsername(paramUsername) : request.auth.credentials).then((user: User) => getPublicUser(user, request.auth.credentials));
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/users/{username}/followers
		 * @param request Request-Object
		 * @param request.params.username username (optional)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getFollowers(request: any, reply: any): void {
			let paramUsername = encodeURIComponent(request.params.username);
			
			// Create user promise.
			let promise : Promise<User> = Promise.resolve(paramUsername != 'me' ? findByUsername(paramUsername) : request.auth.credentials).then((user: User) => {
				return getUserConnections(null, user);
			}).then((users: User[]) => getPublicUser(users, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/users/{username}/followees
		 * @param request Request-Object
		 * @param request.params.username username (optional)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getFollowees(request: any, reply: any): void {
			let paramUsername = encodeURIComponent(request.params.username);
			
			// Create user promise.
			let promise : Promise<User> = Promise.resolve(paramUsername != 'me' ? findByUsername(paramUsername) : request.auth.credentials).then((user: User) => {
				return getUserConnections(user, null);
			}).then((users: User[]) => getPublicUser(users, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/users/follow/{followee}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.followee followee
		 * @param reply Reply-Object
		 */
		export function addFollowee(request: any, reply: any): void {
			let paramFollowee = encodeURIComponent(request.params.followee);
			
			let promise = findByUsername(paramFollowee).then((followee: User) => {
				// Does connection already exist?
				return getUserConnections(request.auth.credentials, followee).then((users: User[]) => {
					// Add connection, if not.
					if (users.length == 0) return addUserConnection(request.auth.credentials, followee);
				}).then(() => getPublicUser(followee, request.auth.credentials));
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/users/unfollow/{followee}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.followee followee
		 * @param reply Reply-Object
		 */
		export function deleteFollowee(request: any, reply: any): void {
			let paramFollowee = encodeURIComponent(request.params.followee);
			
			let promise = findByUsername(paramFollowee).then((followee: User) => {
				return removeUserConnection(request.auth.credentials, followee).then(() => getPublicUser(followee, request.auth.credentials));
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
