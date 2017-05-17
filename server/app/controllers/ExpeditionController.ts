import * as Boom from "boom";
import * as dot from "dot-object";
import {DatabaseManager, TransactionSession} from "../Database";
import {Rudel} from "../models/rudel/Rudel";
import {User} from "../models/user/User";
import {Expedition} from "../models/expedition/Expedition";
import {UserController} from "./UserController";
import {UserJoinsExpedition} from "../models/user/UserJoinsExpedition";
import * as moment from "moment";
import {UtilController} from "./UtilController";
import * as Random from 'random-seed';
import * as Uuid from 'uuid';
import {Config} from '../../../run/config';
import {ExpeditionRecipe} from '../../../client/app/models/expedition';
import Transaction from 'neo4j-driver/lib/v1/transaction';
import Result from 'neo4j-driver/lib/v1/result';
import {RudelController} from './RudelController';

export module ExpeditionController {
	
	export const FUZZY_HOURS = 3;
	export const FUZZY_METERS = 500;
	
	export function getPublicExpedition(transaction: Transaction, expedition: Expedition | Expedition[], relatedUser: User) : Promise<any | any[]> {
		let createPublicExpedition = (expedition: Expedition) : Promise<any> => {
			let expeditionOwnerPromise = ExpeditionController.getOwner(transaction, expedition);
			let publicExpeditionOwnerPromise = expeditionOwnerPromise.then((owner: User) => {
				return UserController.getPublicUser(transaction, owner, relatedUser);
			});
			let expeditionStatisticsPromise = ExpeditionController.getStatistics(transaction, expedition, relatedUser);
			let rudelPromise = ExpeditionController.getRudel(transaction, expedition).then((rudel: Rudel) => {
				return RudelController.getPublicRudel(transaction, rudel, relatedUser);
			});
			
			return Promise.all([
				expeditionOwnerPromise,
				publicExpeditionOwnerPromise,
				expeditionStatisticsPromise,
			    rudelPromise
			]).then((values: [User, any, ExpeditionStatistics, Rudel]) => {
				// Add default links.
				let links = {
					icon: UtilController.getIconUrl(expedition.icon)
				};
				
				// Mask data for unapproved users.
				if(!values[2].isApproved) {
					// Seedable randomness to prevent hijacking unmasked data by recalling this function multiple times.
					let randomSeed: Random.RandomSeed = Random.create(expedition.id + Config.backend.salts.random);
					
					// Mask time.
					if(expedition.fuzzyTime) moment(expedition.date).add(randomSeed.intBetween(-FUZZY_HOURS, FUZZY_HOURS), 'hours').minute(0).second(0).millisecond(0);
					
					// Mask location.
					let distance = randomSeed.intBetween(-FUZZY_METERS, FUZZY_METERS);
					let pi = Math.PI;
					let R = 6378137; // Earth’s radius
					let dLat = distance / R;
					let dLng = distance / ( R * Math.cos(pi * expedition.location.lng / 180) );
					expedition.location.lat = expedition.location.lat + ( dLat * 180 / pi );
					expedition.location.lng = expedition.location.lng + ( dLng * 180 / pi );
				}
				
				// Build profile.
				return Promise.resolve(dot.transform({
					'expedition.id': 'id',
					'expedition.title': 'title',
					'expedition.description': 'description',
					'expedition.date': 'date.isoString',
					'dateAccuracy': 'date.accuracy',
					'expedition.icon': 'icon',
					'expedition.needsApproval': 'needsApproval',
					'expedition.location': 'location',
					"locationAccuracy": "location.accuracy",
					"activity": "activity",
					'links': 'links',
					'owner': 'owner',
					'isOwner': 'relations.isOwned',
					'statistics.isApproved': 'relations.isApproved',
					'statistics.isAwaiting': 'relations.isAwaiting',
					'statistics.awaitingUsers': 'statistics.awaitingUsers',
					'statistics.approvedUsers': 'statistics.approvedUsers'
				}, {
					locationAccuracy: expedition.needsApproval ? ExpeditionController.FUZZY_METERS : 0,
					dateAccuracy: expedition.fuzzyTime ? ExpeditionController.FUZZY_HOURS * 3600 : 0,
					statistics: values[2],
					expedition: expedition,
					activity: values[3],
					links: links,
					owner: values[1],
					isOwner: values[0].id == relatedUser.id
				}));
			});
		};
		let now = Date.now();
		let transformed = expedition instanceof Array ? Promise.all(expedition.map(createPublicExpedition)) : createPublicExpedition(expedition);
		return transformed.then((result: any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' expeditions' : '1 expedition'} took ${Date.now() - now} millis`);
			return result;
		});
	}
	
	export interface ExpeditionStatistics {
		approvedUsers: number;
		awaitingUsers: number;
		isApproved: boolean;
		isAwaiting: boolean;
	}
	
	export function getStatistics(transaction: Transaction, expedition: Expedition, relatedUser: User) : Promise<ExpeditionStatistics> {
		// Set queries.
		let queries: string[] = [
			"MATCH (user:User {id: $userId})-[fr:FOLLOWS_RUDEL]->() WITH COUNT(fr) as rudelCount, user",
			"MATCH (user)-[fl:FOLLOWS_LIST]->() WITH rudelCount, COUNT(fl) as listsCount, user",
			"MATCH (user)-[:FOLLOWS_USER]->(fes:User) WITH rudelCount, listsCount, fes as followees, COUNT(fes) as followeesCount, user",
			"MATCH (user)<-[:FOLLOWS_USER]-(frs:User) WITH rudelCount, listsCount, followees, followeesCount, frs as followers, COUNT(frs) as followersCount, user"
		];
		
		let transformations: string[] = [
			"rudel: rudelCount",
			"lists: listsCount",
			"followees: followeesCount",
			"followers: followersCount"
		];
		
		// Set additional queries for relational data. TODO
		if(0 == 0) {
			queries = queries.concat([
				" MATCH (relatedUser:User {id: $relatedUserId})-[mfes:FOLLOWS_USER]->(followees) WITH rudelCount, listsCount, followeesCount, followersCount, COUNT(mfes) as mutualFolloweesCount, user, relatedUser",
				" MATCH (relatedUser)<-[mfrs:FOLLOWS_USER]-(followers) WITH rudelCount, listsCount, followeesCount, followersCount, mutualFolloweesCount, COUNT(mfrs) as mutualFollowersCount, user, relatedUser",
				" MATCH (user)<-[fu:FOLLOWS_USER]-(relatedUser) WITH rudelCount, listsCount, followeesCount, followersCount, mutualFolloweesCount, mutualFollowersCount, COUNT(fu) > 0 as isFollower, user, relatedUser",
				" MATCH (user)-[fu:FOLLOWS_USER]->(relatedUser) WITH rudelCount, listsCount, followeesCount, followersCount, mutualFolloweesCount, mutualFollowersCount, isFollower, COUNT(fu) > 0 as isFollowee",
			]);
			
			transformations = transformations.concat([
				"mutualFollowers: mutualFolloweesCount",
				"mutualFollowees: mutualFollowersCount",
				"isFollower: isFollower",
				"isFollowee: isFollowee"
			])
		}
		
		// Add final query.
		queries.push(`RETURN {${transformations.join(',')}`);
		
		// Run query.
		transaction.run(queries.join(' '), {
			expeditionId: expedition.id,
			relatedUserId: relatedUser ? relatedUser.id: null
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 0).pop());
		
		return Promise.resolve({
			approvedUsers: 3,
			awaitingUsers: 2,
			isApproved: false,
			isAwaiting: false
		});
	}
	
	export function findByUser(transaction: Transaction, user: User, ownsOnly = false, skip = 0, limit = 25) : Promise<Expedition[]> {
		return transaction.run<Expedition, any>(`MATCH(:User {id: $userId})-[:${ownsOnly ? 'OWNS_EXPEDITION' : 'JOINS_EXPEDITION'}]->(e:Expedition) RETURN properties(e) as e SKIP $skip LIMIT $limit`, {
			userId: user.id,
			limit: limit,
			skip: skip
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'e'));
	}
	
	export function get(transaction: Transaction, expeditionId: string): Promise<Expedition> {
		return transaction.run<Expedition, any>(`MATCH(e:Expedition {id: $expeditionId}) RETURN properties(e) as e LIMIT 1`, {
			expeditionId: expeditionId,
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'e').pop());
	}
	
	export function findByFulltext(transaction: Transaction, query: string, limit = 0, skip = 25) : Promise<Expedition[]>{
		return transaction.run<Expedition, any>('WITH split($query, " ") AS words UNWIND words AS word MATCH (e:Expedition) WHERE e.meta.fulltextSearchData CONTAINS word RETURN properties(e) as e SKIP $skip LIMIT $limit', {
			query: query,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'e'));
	}
	
	export function approveUser(transaction: Transaction, expedition: Expedition, user: User) : Promise<void> {
		//TODO
		return transaction.run("MATCH(e:Expedition {id : $expeditionId }), (u:User {id: $userId}) CREATE UNIQUE(e)<-[:JOINS_EXPEDITION]-(u)", {
			expeditionId: expedition.id,
			userId: user.id
		}).then(() => {});
	}
	
	export function rejectUser(transaction: Transaction, expedition: User, user: User): Promise<void> {
		//TODO
		return transaction.run("MATCH(e:Expedition {id : $expeditionId })<-[je:JOINS_EXPEDITION]-(u:User {id: $userId}) DELETE je", {
			expeditionId: expedition.id,
			userId: user.id
		}).then(() => {});
	}
	
	export function removeExpeditions(transaction: Transaction, rudel: Rudel): Promise<void> {
		return transaction.run(`MATCH(:Rudel {id: $rudelId})<-[:BELONGS_TO_RUDEL]-(e:Expedition) DETACH DELETE e`, {
			rudelId: rudel.id,
		}).then(() => {});
	}
	
	export function removeExpedition(transaction: Transaction, expedition: Expedition): Promise<void> {
		return transaction.run(`MATCH(:Expedition {id: $expeditionId}) DETACH DELETE e`, {
			expeditionId: expedition.id,
		}).then(() => {});
	}
	
	export function create(transaction: Transaction, recipe: ExpeditionRecipe) : Promise<Expedition> {
		let expedition: Expedition = {
			id: Uuid.v4(),
			title: recipe.title,
			description: recipe.description,
			needsApproval: recipe.needsApproval,
			date: recipe.date,
			icon: recipe.icon,
			location: recipe.location,
			fuzzyTime: recipe.fuzzyTime,
			createdAt: null,
			updatedAt: null
		};
		return this.save(transaction, expedition).then(() => {});
	}
	
	export function save(transaction: Transaction, expedition: Expedition): Promise<void> {
		// Set timestamps.
		let now = new Date().toISOString();
		if(!expedition.createdAt) expedition.createdAt = now;
		expedition.updatedAt = now;
		
		// Save.
		return transaction.run("MERGE (e:Expedition {id: $expedition.id}) ON CREATE SET e = $flattenExpedition ON MATCH SET e = $flattenExpedition", {
			expedition: expedition,
			flattenExpedition: DatabaseManager.neo4jFunctions.flatten(expedition)
		}).then(() => {});
	}
	
	export function setOwner(transaction: Transaction, expedition: Expedition, user: User): Promise<void> {
		return transaction.run("MATCH(e:Expedition {id : $expeditionId })<-[oe:OWNS_EXPEDITION]-(ou:User), (nu: User {id: $userId}) CREATE (e)<-[:type(oe) properties(oe)]-(nu) DETACH DELETE oe", {
			expeditionId: expedition.id,
			userId: user.id
		}).then(() => {});
	}
	
	export function getOwner(transaction: Transaction, expedition: Expedition) : Promise<User> {
		return transaction.run<User, any>("MATCH(:Expedition {id : $expeditionId })<-[:OWNS_EXPEDITION]-(u:User) RETURN properties(u) as u LIMIT 1", {
			expeditionId: expedition.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'u'));
	}
	
	export function setRudel(transaction: Transaction, expedition: Expedition, rudel: Rudel): Promise<void> {
		//TODO
		return transaction.run("MATCH(e:Expedition {id : $expeditionId })<-[oe:OWNS_EXPEDITION]-(ou:User), (nu: User {id: $userId}) CREATE (e)<-[:type(oe) properties(oe)]-(nu) DETACH DELETE oe", {
			expeditionId: expedition.id,
			userId: rudel.id
		}).then(() => {});
	}
	
	export function getRudel(transaction: Transaction, expedition: Expedition): Promise<Rudel> {
		return transaction.run<Rudel, any>("MATCH(:Expedition {id : $expeditionId })-[:BELONGS_TO_RUDEL]->(r:Rudel) RETURN properties(r) as r LIMIT 1", {
			expeditionId: expedition.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'r'));
	}
	
	export function getNearbyExpeditions(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Expedition[]> {
		return transaction.run<Expedition, any>("MATCH(e:Expedition) ORDER BY distance(point($location), point(e.location)) RETURN properties(e) as e SKIP $skip LIMIT $limit", {
			location: user.location,
			limit: limit,
			skip: skip
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'e'));
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [POST] /api/expeditions/create
		 * @param request Request-Object
		 *
		 * @param request.payload.expedition.title title
		 * @param request.payload.expedition.description description
		 * @param request.payload.expedition.needsApproval needsApproval
		 * @param request.payload.expedition.date date
		 * @param request.payload.expedition.icon icon
		 * @param request.payload.expedition.location location
		 * @param request.payload.expedition.fuzzyTime fuzzyTime
		 * @param request.payload.rudel rudel
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function create(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.payload.rudel).then((rudel: Rudel) => {
				if(!rudel) return Promise.reject(Boom.badRequest('Rudel does not exist!'));
				
				return ExpeditionController.create(transaction, request.payload.expedition).then((expedition: Expedition) => {
					return Promise.all([
						ExpeditionController.setOwner(transaction, expedition, request.auth.credentials),
						ExpeditionController.approveUser(transaction, expedition, request.auth.credentials),
						ExpeditionController.setRudel(transaction, expedition, rudel)
					]).then(() => expedition);
				}).then((expedition: Expedition) => ExpeditionController.getPublicExpedition(transaction, expedition, request.auth.credentials));
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/=/{key}
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function get(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise : Promise<Expedition> = ExpeditionController.get(transaction, request.params.id).then((expedition: Expedition) => {
				if (!expedition) return Promise.reject(Boom.notFound('Expedition not found.'));
				return ExpeditionController.getPublicExpedition(transaction, expedition, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/like/{query}/{offset?}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.params.offset offset (optional, default=0)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function like(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise : Promise<Expedition[]> = ExpeditionController.findByFulltext(request.params.query, request.params.offset).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/by/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function by(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then(user => {
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return ExpeditionController.findByUser(transaction, user);
			}).then((expeditions: Expedition[]) => ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/by/{username}/in/{rudel}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.params.rudel rudel
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		
		export function getActivityExpeditionsBy(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then(user => {
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return ExpeditionController.findByUser(transaction, user);
			}).then((expeditions: Expedition[]) => ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/within/{radius}
		 * @param request Request-Object
		 * @param request.params.radius number
		 * @param request.params.rudel rudel
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function nearby(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise : Promise<any> = ExpeditionController.getNearbyExpeditions(transaction, request.auth.credentials).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/within/{radius}/in/{rudel}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.params.rudel rudel
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getActivityExpeditionsNearby(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise : Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then(user => {
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return ExpeditionController.findByUser(transaction, user);
			}).then((expeditions: Expedition[]) => ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
	}
}
