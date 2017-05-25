import * as Boom from "boom";
import * as dot from "dot-object";
import Transaction from "neo4j-driver/lib/v1/transaction";
import {Config} from "../../../run/config";
import {User} from "../models/user/User";
import {DatabaseManager, TransactionSession} from "../Database";
import Result from 'neo4j-driver/lib/v1/result';

export module UserController {
	
	export function findByFulltext(transaction: Transaction, query: string, skip = 0, limit = 25) : Promise<User[]>{
		return transaction.run<User, any>('CALL apoc.index.search("User", $query) YIELD node WITH properties(node) as u RETURN u SKIP $skip LIMIT $limit', {
			query: `${query}~`,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'u'));
	}
	
	export function findByUsername(transaction: Transaction, username: string): Promise<User> {
		return transaction.run<User, any>('MATCH(u:User {username: $username}) RETURN COALESCE(properties(u), []) as u LIMIT 1', {
			username: username
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'u').pop());
	}
	
	export function findByMail(transaction: Transaction, mail: string): Promise<User> {
		return transaction.run<User, any>('MATCH(u:User) WHERE (u.mails_primary_mail = $mail AND u.mails_primary_verified) OR (u.mails_secondary_mail = $mail AND u.mails_secondary_verified) RETURN COALESCE(properties(u), []) as u LIMIT 1', {
			mail: mail
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'u').pop());
	}
	
	export interface UserStatistics {
		rudel: number;
		followers: number;
		followees: number;
		lists: number;
		mutualFollowers?: number;
		mutualFollowees?: number;
		isFollower?: boolean;
		isFollowee?: boolean;
	}
	
	export function getStatistics(transaction: Transaction, user: User, relatedUser: User) : Promise<UserStatistics> {
		// Set queries.
		let queries: string[] = [
			"MATCH (user:User {id: $userId})",
			"OPTIONAL MATCH (user)-[fr:FOLLOWS_RUDEL]->() WITH COUNT(fr) as rudelCount, user",
			"OPTIONAL MATCH (user)-[fl:FOLLOWS_LIST]->() WITH rudelCount, COUNT(fl) as listsCount, user",
			"OPTIONAL MATCH (user)-[:FOLLOWS_USER]->(fes:User) WITH rudelCount, listsCount, fes as followees, COUNT(fes) as followeesCount, user",
			"OPTIONAL MATCH (user)<-[:FOLLOWS_USER]-(frs:User) WITH rudelCount, listsCount, followees, followeesCount, frs as followers, COUNT(frs) as followersCount, user"
		];
		
		let transformations: string[] = [
			"rudel: rudelCount",
			"lists: listsCount",
			"followees: followeesCount",
			"followers: followersCount"
		];
		
		// Set additional queries for relational data.
		if(user.id != relatedUser.id) {
			queries = queries.concat([
				"MATCH (relatedUser:User {id: $relatedUserId}) WITH rudelCount, listsCount, followees, followeesCount, followers, followersCount, user, relatedUser",
				"OPTIONAL MATCH (relatedUser)-[mfes:FOLLOWS_USER]->(followees) WITH rudelCount, listsCount, followeesCount, followersCount, COUNT(mfes) as mutualFolloweesCount, user, relatedUser",
				"OPTIONAL MATCH (relatedUser)<-[mfrs:FOLLOWS_USER]-(followers) WITH rudelCount, listsCount, followeesCount, followersCount, mutualFolloweesCount, COUNT(mfrs) as mutualFollowersCount, user, relatedUser",
				"OPTIONAL MATCH (user)<-[fu:FOLLOWS_USER]-(relatedUser) WITH rudelCount, listsCount, followeesCount, followersCount, mutualFolloweesCount, mutualFollowersCount, COUNT(fu) > 0 as isFollowee, user, relatedUser",
				"OPTIONAL MATCH (user)-[fu:FOLLOWS_USER]->(relatedUser) WITH rudelCount, listsCount, followeesCount, followersCount, mutualFolloweesCount, mutualFollowersCount, isFollowee, COUNT(fu) > 0 as isFollower",
			]);
			
			transformations = transformations.concat([
				"mutualFollowers: mutualFolloweesCount",
				"mutualFollowees: mutualFollowersCount",
				"isFollower: isFollower",
				"isFollowee: isFollowee"
			])
		}
		
		// Add final query.
		queries.push(`RETURN {${transformations.join(',')}}`);
		
		// Run query.
		return transaction.run<any, any>(queries.join(' '), {
			userId: user.id,
			relatedUserId: relatedUser.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 0).pop());
	}
	
	export function getPublicUser(transaction: Transaction, user: User | User[], relatedUser: User): Promise<any | any[]> {
		let createPublicUser = (user: User) => {
			// Run further promises.
			return Promise.all([
				UserController.getStatistics(transaction, user, relatedUser)
			]).then((results : [UserStatistics]) => {
				console.log(results);
				// Define default links.
				let links: any = {
					followers: `${Config.backend.domain}/api/users/${user.username}/followers`,
					followees: `${Config.backend.domain}/api/users/${user.username}/following`
				};
				
				// Define avatar links?
				if(user.hasAvatar) {
					links['avatars'] = {
						small: `${Config.backend.domain + Config.paths.avatars.publicPath + user.id}-small`,
						medium: `${Config.backend.domain + Config.paths.avatars.publicPath + user.id}-medium`,
						large: `${Config.backend.domain + Config.paths.avatars.publicPath + user.id}-large`
					};
				}
				
				let transformationRecipe = {
					'user._key': 'id',
					'user.username': 'username',
					'user.firstName': 'firstName',
					'user.lastName': 'lastName',
					'user.hasAvatar': 'hasAvatar',
					'user.profileText': 'profileText',
					'user.onBoard': 'onBoard',
					'user.languages': 'languages',
					'user.createdAt': 'createdAt',
					'user.updatedAt': 'updatedAt',
					'links': 'links',
					'statistics.rudel': 'statistics.rudel',
					'statistics.followers': 'statistics.followers',
					'statistics.followees': 'statistics.followees',
					'statistics.lists': 'statistics.lists',
					'statistics.mutualFollowers': 'relations.mutualFollowers',
					'statistics.mutualFollowees': 'relations.mutualFollowees',
					'statistics.isFollower': 'relations.isFollower',
					'statistics.isFollowee': 'relations.isFollowee'
				};
				
				// Emit private information.
				if(user.id == relatedUser.id) Object.assign(transformationRecipe, {
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
	
	export function followers(transaction: Transaction, user: User, skip: number = 0, limit: number = 25) : Promise<User[]> {
		return transaction.run<User, any>(`MATCH(:User {id: $userId})<-[:FOLLOWS_USER]-(followers:User) RETURN COALESCE(properties(followers), []) as followers SKIP $skip LIMIT $limit`, {
			userId: user.id,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'followers'));
	}
	
	export function followees(transaction: Transaction, user: User, skip: number = 0, limit: number = 25) : Promise<User[]> {
		return transaction.run<User, any>(`MATCH(:User {id: $userId})-[:FOLLOWS_USER]->(followees:User) RETURN COALESCE(properties(followees), []) as followees SKIP $skip LIMIT $limit`, {
			userId: user.id,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'followees'));
	}
	
	export function follow(transaction: Transaction, user: User, aimedUser: User) : Promise<void> {
		if (aimedUser.id === user.id) return Promise.reject<void>('Users cannot follow themselves.');
		return transaction.run("MATCH(user:User {id: $userId}), (followee:User {id: $followeeUserId}) MERGE (user)-[:FOLLOWS_USER {createdAt: $now}]->(followee)", {
			userId: user.id,
			followeeUserId: aimedUser.id,
			now: new Date().toISOString()
		}).then(() => {});
	}
	
	export function unfollow(transaction: Transaction, user: User, aimedUser: User) : Promise<void> {
		if (aimedUser.id === user.id) return Promise.reject<void>('Users cannot unfollow themselves.');
		return transaction.run("MATCH(user:User {id: $userId})-[fu:FOLLOWS_USER]->(followee:User {id: $followeeUserId}) DETACH DELETE fu", {
			userId: user.id,
			followeeUserId: aimedUser.id
		}).then(() => {});
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [GET] /api/users/=/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param reply Reply-Object
		 */
		export function getUser(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise : Promise<User> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then((user: User) => {
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return UserController.getPublicUser(transaction, user, request.auth.credentials);
			});
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/users/like/{query}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getUsersLike(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise : Promise<User[]> = UserController.findByFulltext(transaction, request.params.query, request.query.offset, request.query.limit).then((users: User[]) => {
				return UserController.getPublicUser(transaction, users, request.auth.credentials)
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/users/=/{username}/followers
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function followers(request: any, reply: any): void {
			// Create user promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise : Promise<User> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then((user: User) => {
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return UserController.followers(transaction, user, request.query.offset, request.query.limit);
			}).then((users: User[]) => UserController.getPublicUser(transaction, users, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/users/=/{username}/followees
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function followees(request: any, reply: any): void {
			// Create user promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise : Promise<User> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then((user: User) => {
				if (!user) return Promise.reject(Boom.badRequest('User does not exist!'));
				return UserController.followees(transaction, user, request.query.offset, request.query.limit);
			}).then((users: User[]) => UserController.getPublicUser(transaction, users, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/users/follow/{followee}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.followee followee
		 * @param reply Reply-Object
		 */
		export function follow(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = UserController.findByUsername(transaction, request.params.followee).then((followee: User) => {
				if(!followee) return Promise.reject(Boom.notFound('Followee not found!'));
				return UserController.follow(transaction, request.auth.credentials, followee).then(() => {
					return UserController.getPublicUser(transaction, followee, request.auth.credentials);
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/users/unfollow/{followee}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.followee followee
		 * @param reply Reply-Object
		 */
		export function unfollow(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = findByUsername(transaction, request.params.followee).then((followee: User) => {
				if(!followee) return Promise.reject(Boom.notFound('Followee not found!'));
				return UserController.unfollow(transaction, request.auth.credentials, followee).then(() => {
					return UserController.getPublicUser(transaction, followee, request.auth.credentials);
				});
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
