import Nodemailer = require("nodemailer");
import Boom = require("boom");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {Config} from "../../../run/config";
import {User, UserProvider} from "../models/user/User";
import {DatabaseManager} from "../Database";
import {DecodedToken} from "../models/Token";
import {Cursor} from "arangojs";
import {UserFollowsUser} from "../models/user/UserFollowsUser";
import {AuthController} from "./AuthController";
import jwt = require("jsonwebtoken");
import _ = require("lodash");

export module UserController {
	
	export function findByFulltext(query: string) : Promise<User[]>{
		let aqlQuery = `FOR user IN FULLTEXT(@@collection, "meta.fulltextSearchData", @query) RETURN user`;
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.users.name,
			query: query.split(' ').map(word => '+prefix:' + word).join()
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<User[]>;
	}
	
	export function findByProvider(provider: UserProvider): Promise<User> {
		let aqlQuery = `FOR u IN @@collection FOR p IN u.auth.providers FILTER p.provider == @provider && p.userIdentifier == @userIdentifier RETURN u`;
		let aqlParams = {
			'@collection': DatabaseManager.arangoCollections.users.name,
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
			'@collection': DatabaseManager.arangoCollections.users.name,
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
			'@collection': DatabaseManager.arangoCollections.users.name,
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
				'@collection': DatabaseManager.arangoCollections.users.name,
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
	
	export function findByKey(key: string | string[]): Promise<User | User[]> {
		let collection = DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.users.name);
		return key instanceof Array ? collection.lookupByKeys(key) as Promise<User[]> : collection.document(key) as Promise<User>;
	}
	
	export interface UserStatistics {
		activities: number;
		followers: number;
		followees: number;
		lists: number;
		mutualFollowers?: number;
		mutualFollowees?: number;
		isFollower?: boolean;
		isFollowee?: boolean;
	}
	
	export function getUserStatistics(user: User, relatedUser: User) : Promise<UserStatistics> {
		// Base query.
		let queries: string[] = [
			'LET followers = (FOR follower IN INBOUND @userId @@edgesUserFollowsUser RETURN follower._id)',
			'LET followees = (FOR followee IN OUTBOUND @userId @@edgesUserFollowsUser RETURN followee._id)',
			'LET activities = (FOR activity IN OUTBOUND @userId @@edgesUserFollowsActivity RETURN activity._id)',
			'LET lists = (FOR list IN OUTBOUND @userId @@edgesUserFollowsList RETURN list._id)'
		];
		
		let returnedParameters: string[] = [
			'activities: LENGTH(activities)',
			'lists: LENGTH(lists)',
			'followers: LENGTH(followers)',
			'followees: LENGTH(followees)'
		];
		
		let aqlParams = {
			'@edgesUserFollowsUser': DatabaseManager.arangoCollections.userFollowsUser.name,
			'@edgesUserFollowsActivity': DatabaseManager.arangoCollections.userFollowsActivity.name,
			'@edgesUserFollowsList': DatabaseManager.arangoCollections.userFollowsList.name,
			userId: user._id
		};
		
		// Additional queries for relational data.
		if(user._id != relatedUser._id) {
			// Add query strings.
			queries.push(...[
				'LET mutualFollowees = LENGTH(INTERSECTION(followees, (FOR followee IN OUTBOUND @relatedUserId @@edgesUserFollowsUser RETURN followee._id)))',
				'LET mutualFollowers = LENGTH(INTERSECTION(followers, (FOR follower IN OUTBOUND @relatedUserId @@edgesUserFollowsUser RETURN follower._id)))',
				'LET isFollowee = LENGTH(INTERSECTION(followers, [@relatedUserId])) > 0',
				'LET isFollower = LENGTH(INTERSECTION(followees, [@relatedUserId])) > 0'
			]);
			
			// Add parameter strings.
			returnedParameters.push(...[
				'mutualFollowees: mutualFollowees',
				'mutualFollowers: mutualFollowers',
				'isFollowee: isFollowee',
				'isFollower: isFollower'
			]);
			
			// Add variable.
			aqlParams['relatedUserId'] = relatedUser._id;
		}
		
		// Add returning query.
		queries.push(`RETURN {${returnedParameters.join(',')}}`);
		
		// Build whole query.
		let aqlQuery = queries.join(' ');
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<UserStatistics>;
	}
	
	export function getPublicUser(user: User | User[], relatedUser: User): Promise<any> {
		let createPublicUser = (user: User) => {
			// Run further promises.
			return Promise.all([
				getUserStatistics(user, relatedUser)
			]).then((results : [UserStatistics]) => {
				// Define default links.
				//TODO UPDATE LINKS
				let links = {
					followers: `${Config.backend.domain}/api/users/${user.username}/followers`,
					followees: `${Config.backend.domain}/api/users/${user.username}/following`
				};
				
				// Define avatar links?
				if(user.meta.hasAvatar) {
					links['avatars'] = {
						small: `${Config.backend.domain + Config.paths.avatars.publicPath + user._key}-small`,
						medium: `${Config.backend.domain + Config.paths.avatars.publicPath + user._key}-medium`,
						large: `${Config.backend.domain + Config.paths.avatars.publicPath + user._key}-large`
					};
				}
				
				let transformationRecipe = {
					'user._key': 'id',
					'user.username': 'username',
					'user.firstName': 'firstName',
					'user.lastName': 'lastName',
					'user.meta.hasAvatar': 'meta.hasAvatar',
					'user.meta.profileText': 'meta.profileText',
					'user.meta.onBoard': 'meta.onBoard',
					'user.languages': 'languages',
					'user.createdAt': 'createdAt',
					'links': 'links',
					'statistics.activities': 'statistics.activities',
					'statistics.followers': 'statistics.followers',
					'statistics.followees': 'statistics.followees',
					'statistics.lists': 'statistics.lists',
					'statistics.mutualFollowers': 'relations.mutualFollowers',
					'statistics.mutualFollowees': 'relations.mutualFollowees',
					'statistics.isFollower': 'relations.isFollower',
					'statistics.isFollowee': 'relations.isFollowee'
				};
				
				// Emit private information.
				if(user._key == relatedUser._key) Object.assign(transformationRecipe, {
					'user.location': 'location'
				});
				
				return dot.transform(transformationRecipe, {
					user: user,
					statistics: results[0],
					links: links
				}) as any;
			});
		};
		
		let now = Date.now();
		let transformed = user instanceof Array ? Promise.all(user.map(createPublicUser)) : createPublicUser(user);
		return transformed.then((result : any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' users' : '1 user'} took ${Date.now() - now} millis`);
			return result;
		});
	}
	
	export function getUserConnections(from: User, to: User, skip: number | boolean = false, limit: number | false = false) : Promise<UserFollowsUser[]> {
		let example = {};
		if(from) example['_from'] = from._id;
		if(to) example['_to'] = to._id;
		
		let opts = {};
		if(skip) opts['skip'] = skip;
		if(limit) opts['limit'] = limit;
		
		return DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsUser.name).byExample(example, opts).then((cursor: Cursor) => cursor.all());
	}
	
	export function addUserConnection(user: User, aimedUser: User) : Promise<UserFollowsUser> {
		if(aimedUser._id === user._id) return Promise.reject<UserFollowsUser>(Boom.badRequest('Users cannot follow themselves.'));
		
		return getUserConnections(user, aimedUser, 0, 1).then((connections: UserFollowsUser[]) => {
			// Try to return any existing connection.
			if(connections.length > 0) return connections[0];
			
			// Add connection.
			let now = new Date().toISOString();
			let edge : UserFollowsUser = {
				_from: user._id,
				_to: aimedUser._id,
				createdAt: now,
				updatedAt: now
			};
			return DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsUser.name).save(edge);
		});
	}
	
	export function removeUserConnection(user: User, aimedUser: User): Promise<void> {
		return DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name).edgeCollection(DatabaseManager.arangoCollections.userFollowsUser.name).removeByExample({
			_from: user._id,
			_to: aimedUser._id
		}).then((t) => {
			console.log({
				_from: user._id,
				_to: aimedUser._id
			});
		});
	}
	
	export function getMutualConnections(users: User[], inbound = true): Promise<User[]> {
		if(!users || users.length < 2) throw('Invalid arguments: At least choose two users for mutual comparison.');
		let friendsOfUser = users.map((user: User, index: number) => `(FOR v IN ${inbound ? 'INBOUND' : 'OUTBOUND'} @user_${index} @@edges RETURN v._id)`).join(',');
		let aqlQuery = `FOR u IN INTERSECTION (${friendsOfUser}) RETURN u`;
		let aqlParam = {
			'@edges': DatabaseManager.arangoCollections.userFollowsUser.name
		};
		users.forEach((user: User, index: number) => {
			aqlParam[`user_${index}`] = user._id;
		});
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParam).then((cursor: Cursor) => cursor.all()) as any as Promise<User[]>;
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [GET] /api/users/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param reply Reply-Object
		 */
		export function getUser(request: any, reply: any): void {
			let promise : Promise<User> = Promise.resolve(request.params.username != 'me' ? findByUsername(request.params.username) : request.auth.credentials).then((user: User) => getPublicUser(user, request.auth.credentials));
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/users/like/{query}/{offset?}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.params.offset offset (optional, default=0)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getUsersLike(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<User[]> = UserController.findByFulltext(request.params.query).then((users: User[]) => UserController.getPublicUser(users.slice(request.params.offset, request.params.offset + 30), request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/users/=/{username}/followers/{offset?}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.params.offset offset (optional, default=0)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getFollowers(request: any, reply: any): void {
			// Create user promise.
			let promise : Promise<User> = Promise.resolve(request.params.username != 'me' ? findByUsername(request.params.username) : request.auth.credentials).then((user: User) => {
				return getUserConnections(null, user, request.params.offset, request.params.offset + 30).then(connections => {
					let connectionKeys: string[] = connections.map(connection => connection._from);
					return findByKey(connectionKeys);
				});
			}).then((users: User[]) => getPublicUser(users, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/users/=/{username}/followees/{offset?}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.params.offset offset (optional, default=0)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getFollowees(request: any, reply: any): void {
			// Create user promise.
			let promise : Promise<User> = Promise.resolve(request.params.username != 'me' ? findByUsername(request.params.username) : request.auth.credentials).then((user: User) => {
				return getUserConnections(user, null, request.params.offset, request.params.offset + 30).then(connections => {
					let connectionKeys: string[] = connections.map(connection => connection._to);
					console.log(connectionKeys);
					return findByKey(connectionKeys);
				});
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
			let promise = findByUsername(request.params.followee).then((followee: User) => {
				return addUserConnection(request.auth.credentials, followee).then(() => getPublicUser(followee, request.auth.credentials));
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
			let promise = findByUsername(request.params.followee).then((followee: User) => {
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
