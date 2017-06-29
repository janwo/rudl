import * as Boom from 'boom';
import * as dot from 'dot-object';
import Transaction from 'neo4j-driver/lib/v1/transaction';
import {Config} from '../../../run/config';
import {User} from '../models/user/User';
import {DatabaseManager, TransactionSession} from '../Database';
import {AccountController} from './AccountController';
import {UtilController} from './UtilController';
import {UserStatistics} from '../../../client/app/models/user';

export module UserController {
	
	export function findByFulltext(transaction: Transaction, query: string, skip = 0, limit = 25): Promise<User[]> {
		return transaction.run<User, any>('CALL apoc.index.search("User", $query) YIELD node WITH properties(node) as u RETURN u SKIP $skip LIMIT $limit', {
			query: `${DatabaseManager.neo4jFunctions.escapeLucene(query)}~`,
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
		likers: number;
		likees: number;
		lists: number;
		mutualLikers?: number;
		mutualLikees?: number;
		isLiker?: boolean;
		isLikee?: boolean;
	}
	
	export function getStatistics(transaction: Transaction, user: User, relatedUser: User): Promise<UserStatistics> {
		// Set queries.
		let queries: string[] = [
			"MATCH (user:User {id: $userId})",
			"OPTIONAL MATCH (user)-[fr:LIKES_RUDEL]->() WITH COUNT(fr) as rudelCount, user",
			"OPTIONAL MATCH (user)-[fl:LIKES_LIST]->() WITH rudelCount, COUNT(fl) as listsCount, user",
			"OPTIONAL MATCH (user)-[:LIKES_USER]->(fes:User) WITH rudelCount, listsCount, fes as likees, COUNT(fes) as likeesCount, user",
			"OPTIONAL MATCH (user)<-[:LIKES_USER]-(frs:User) WITH rudelCount, listsCount, likees, likeesCount, frs as likers, COUNT(frs) as likersCount, user"
		];
		
		let transformations: string[] = [
			"rudel: rudelCount",
			"lists: listsCount",
			"likees: likeesCount",
			"likers: likersCount"
		];
		
		// Set additional queries for relational data.
		if (user.id != relatedUser.id) {
			queries = queries.concat([
				"MATCH (relatedUser:User {id: $relatedUserId}) WITH rudelCount, listsCount, likees, likeesCount, likers, likersCount, user, relatedUser",
				"OPTIONAL MATCH (relatedUser)-[mfes:LIKES_USER]->(likees) WITH rudelCount, listsCount, likeesCount, likersCount, COUNT(mfes) as mutualLikeesCount, user, relatedUser",
				"OPTIONAL MATCH (relatedUser)<-[mfrs:LIKES_USER]-(likers) WITH rudelCount, listsCount, likeesCount, likersCount, mutualLikeesCount, COUNT(mfrs) as mutualLikersCount, user, relatedUser",
				"OPTIONAL MATCH (user)<-[fu:LIKES_USER]-(relatedUser) WITH rudelCount, listsCount, likeesCount, likersCount, mutualLikeesCount, mutualLikersCount, COUNT(fu) > 0 as isLikee, user, relatedUser",
				"OPTIONAL MATCH (user)-[fu:LIKES_USER]->(relatedUser) WITH rudelCount, listsCount, likeesCount, likersCount, mutualLikeesCount, mutualLikersCount, isLikee, COUNT(fu) > 0 as isLiker"
			]);
			
			transformations = transformations.concat([
				"mutualLikers: mutualLikeesCount",
				"mutualLikees: mutualLikersCount",
				"isLiker: isLiker",
				"isLikee: isLikee"
			]);
		}
		
		// Add final query.
		queries.push(`RETURN {${transformations.join(',')}}`);
		
		// Run query.
		return transaction.run<any, any>(queries.join(' '), {
			userId: user.id,
			relatedUserId: relatedUser.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 0).pop());
	}
	
	export function getPublicUser(transaction: Transaction, user: User | User[], relatedUser: User, preview = false): Promise<any | any[]> {
		let createPublicUser = (user: User) => {
			// Gather user information.
			let promises: Promise<UserStatistics | number>[] = [];
			if(!preview) promises.push(UserController.getStatistics(transaction, user, relatedUser));
			if (user.id == relatedUser.id) promises.push(AccountController.NotificationController.countUnread(transaction, user));
			
			// Modify user information.
			return Promise.all(promises).then((values: [UserStatistics, number]) => {
				// Add default links.
				let links: any = {
					likers: `${Config.backend.domain}/api/users/${user.username}/likers`,
					likees: `${Config.backend.domain}/api/users/${user.username}/following`
				};
				
				// Add avatar links?
				if (user.avatarId) {
					links['avatars'] = {
						small: AccountController.getAvatarLink(user, AccountController.AvatarSizes.small),
						medium: AccountController.getAvatarLink(user, AccountController.AvatarSizes.medium),
						large: AccountController.getAvatarLink(user, AccountController.AvatarSizes.large),
					};
				}
				
				let transformationRecipe = {
					'user.id': 'id',
					'user.username': 'username',
					'user.firstName': 'firstName',
					'user.lastName': 'lastName',
					'hasAvatar': 'hasAvatar',
					'user.profileText': 'profileText',
					'createdAt': 'createdAt',
					'updatedAt': 'updatedAt',
					'links': 'links'
				};
				
				let transformationObject = {
					user: user,
					createdAt: UtilController.isoDate(user.createdAt),
					updatedAt: UtilController.isoDate(user.updatedAt),
					hasAvatar: !!user.avatarId,
					links: links
				};
				
				// Emit extended information.
				if (!preview) {
					// Extend transformation recipe.
					transformationRecipe = Object.assign(transformationRecipe, {
						'statistics.rudel': 'statistics.rudel',
						'statistics.likers': 'statistics.likers',
						'statistics.likees': 'statistics.likees',
						'statistics.lists': 'statistics.lists',
						'statistics.mutualLikers': 'relations.mutualLikers',
						'statistics.mutualLikees': 'relations.mutualLikees',
						'statistics.isLiker': 'relations.isLiker',
						'statistics.isLikee': 'relations.isLikee'
					});
					
					// Extend transformation object.
					transformationObject = Object.assign(transformationObject, {
						statistics: values[0]
					});
				}
				
				// Emit private information.
				if (user.id == relatedUser.id) {
					// Extend transformation recipe.
					transformationRecipe = Object.assign(transformationRecipe, {
						'user.location': 'location',
						'user.onBoard': 'onBoard',
						'user.languages': 'languages',
						'unreadNotifications': 'unreadNotifications',
					});
					
					// Extend transformation object.
					transformationObject = Object.assign(transformationObject, {
						unreadNotifications: values[1]
					});
				}
				
				return dot.transform(transformationRecipe, transformationObject) as any;
			});
		};
		
		let now = Date.now();
		let transformed = user instanceof Array ? Promise.all(user.map(createPublicUser)) : createPublicUser(user);
		return transformed.then((result: any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' users' : '1 user'} took ${Date.now() - now} millis`);
			return result;
		});
	}
	
	export function likers(transaction: Transaction, user: User, skip: number = 0, limit: number = 25): Promise<User[]> {
		return transaction.run<User, any>(`MATCH(:User {id: $userId})<-[:LIKES_USER]-(likers:User) RETURN COALESCE(properties(likers), []) as likers SKIP $skip LIMIT $limit`, {
			userId: user.id,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'likers'));
	}
	
	export function likees(transaction: Transaction, user: User, skip: number = 0, limit: number = 25): Promise<User[]> {
		return transaction.run<User, any>(`MATCH(:User {id: $userId})-[:LIKES_USER]->(likees:User) RETURN COALESCE(properties(likees), []) as likees SKIP $skip LIMIT $limit`, {
			userId: user.id,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'likees'));
	}
	
	export function like(transaction: Transaction, user: User, aimedUser: User): Promise<void> {
		if (aimedUser.id === user.id) return Promise.reject<void>('Users cannot follow themselves.');
		return transaction.run("MATCH(user:User {id: $userId}), (followee:User {id: $followeeUserId}) WHERE NOT (user)-[:LIKES_USER]->(followee) WITH user, followee CREATE UNIQUE (user)-[:LIKES_USER {createdAt: $now}]->(followee) WITH user, followee OPTIONAL MATCH (user)-[dlu:DISLIKES_USER]->(followee) DETACH DELETE dlu", {
			userId: user.id,
			followeeUserId: aimedUser.id,
			now: new Date().getTime() / 1000
		}).then(() => {});
	}
	
	export function dislike(transaction: Transaction, user: User, aimedUser: User): Promise<void> {
		if (aimedUser.id === user.id) return Promise.reject<void>('Users cannot unfollow themselves.');
		return transaction.run("MATCH(user:User {id: $userId}), (followee:User {id: $followeeUserId}) WHERE NOT (user)-[:DISLIKES_USER]->(followee) WITH user, followee CREATE UNIQUE (user)-[:DISLIKES_USER {createdAt: $now}]->(followee) WITH user, followee OPTIONAL MATCH (user)-[lu:LIKES_USER]->(followee) DETACH DELETE lu", {
			userId: user.id,
			followeeUserId: aimedUser.id,
			now: new Date().getTime() / 1000
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
			let promise: Promise<User> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then((user: User) => {
				if (!user) return Promise.reject(Boom.notFound('User not found!'));
				return UserController.getPublicUser(transaction, user, request.auth.credentials);
			});
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/users/search/{query}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function search(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<User[]> = UserController.findByFulltext(transaction, request.params.query, request.query.offset, request.query.limit).then((users: User[]) => {
				return UserController.getPublicUser(transaction, users, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/users/=/{username}/likers
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function likers(request: any, reply: any): void {
			// Create user promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<User> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then((user: User) => {
				if (!user) return Promise.reject(Boom.notFound('User not found!'));
				return UserController.likers(transaction, user, request.query.offset, request.query.limit);
			}).then((users: User[]) => UserController.getPublicUser(transaction, users, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/users/=/{username}/likees
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function likees(request: any, reply: any): void {
			// Create user promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<User> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then((user: User) => {
				if (!user) return Promise.reject(Boom.badRequest('User does not exist!'));
				return UserController.likees(transaction, user, request.query.offset, request.query.limit);
			}).then((users: User[]) => UserController.getPublicUser(transaction, users, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/users/like/{user}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.user user
		 * @param reply Reply-Object
		 */
		export function like(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = UserController.findByUsername(transaction, request.params.user).then((user: User) => {
				if (!user) return Promise.reject(Boom.notFound('User not found!'));
				return UserController.like(transaction, request.auth.credentials, user).then(() => {
					return UserController.getPublicUser(transaction, user, request.auth.credentials);
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/users/dislike/{user}
		 * @param request Request-Object
		 * @param request.auth.credentials
		 * @param request.params.user user
		 * @param reply Reply-Object
		 */
		export function dislike(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = findByUsername(transaction, request.params.user).then((user: User) => {
				if (!user) return Promise.reject(Boom.notFound('User not found!'));
				return UserController.dislike(transaction, request.auth.credentials, user).then(() => {
					return UserController.getPublicUser(transaction, user, request.auth.credentials);
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
