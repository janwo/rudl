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
import * as shortid from 'shortid';
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
				if(expedition.needsApproval && !values[2].isAttendee) {
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
					'expedition.createdAt': 'createdAt',
					'expedition.updatedAt': 'updatedAt',
					"locationAccuracy": "location.accuracy",
					"rudel": "rudel",
					'links': 'links',
					'owner': 'owner',
					'isOwner': 'relations.isOwned',
					'statistics.attendees': 'statistics.attendees',
					'statistics.invitees': 'statistics.invitees',
					'statistics.applicants': 'statistics.applicants',
					'statistics.isAttendee': 'relations.isAttendee',
					'statistics.isInvitee': 'relations.isInvitee',
					'statistics.isApplicant': 'relations.isApplicant'
				}, {
					locationAccuracy: expedition.needsApproval ? ExpeditionController.FUZZY_METERS : 0,
					dateAccuracy: expedition.fuzzyTime ? ExpeditionController.FUZZY_HOURS * 3600 : 0,
					statistics: values[2],
					expedition: expedition,
					rudel: values[3],
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
		attendees: number,
		invitees: number,
		applicants: number,
		isAttendee: boolean,
		isInvitee: boolean,
		isApplicant: boolean
	}
	
	export function getStatistics(transaction: Transaction, expedition: Expedition, relatedUser: User) : Promise<ExpeditionStatistics> {
		// Set queries.
		let queries: string[] = [
			"MATCH (expedition:Expedition {id: $expeditionId})",
			"OPTIONAL MATCH (expedition)<-[je:JOINS_EXPEDITION]-() WITH COUNT(je) as attendees, expedition",
			"OPTIONAL MATCH (expedition)-[pje:POSSIBLY_JOINS_EXPEDITION]->() WITH attendees, COUNT(pje) as invitees, expedition",
			"OPTIONAL MATCH (expedition)<-[pje:POSSIBLY_JOINS_EXPEDITION]-() WITH attendees, invitees, COUNT(pje) as applicants, expedition",
			"OPTIONAL MATCH (expedition)<-[je:JOINS_EXPEDITION]-(relatedUser:User {id: $relatedUserId}) WITH attendees, invitees, applicants, COUNT(je) > 0 as isAttendee, expedition, relatedUser",
			"OPTIONAL MATCH (expedition)<-[pje:POSSIBLY_JOINS_EXPEDITION]-(relatedUser) WITH attendees, invitees, applicants, isAttendee, COUNT(pje) > 0 as isInvitee, expedition, relatedUser",
			"OPTIONAL MATCH (expedition)-[pje:POSSIBLY_JOINS_EXPEDITION]->(relatedUser) WITH attendees, invitees, applicants, isAttendee, isInvitee, COUNT(pje) > 0 as isApplicant, expedition, relatedUser"
		];
		
		let transformations: string[] = [
			"attendees: attendees",
			"invitees: invitees",
			"applicants: applicants",
			"isAttendee: isAttendee",
			"isInvitee: isInvitee",
			"isApplicant: isApplicant"
		];
		
		// Add final query.
		queries.push(`RETURN {${transformations.join(',')}}`);
		
		// Run query.
		return transaction.run(queries.join(' '), {
			expeditionId: expedition.id,
			relatedUserId: relatedUser ? relatedUser.id: null
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 0).pop());
	}
	
	export function findByUser(transaction: Transaction, user: User, ownsOnly = false, skip = 0, limit = 25) : Promise<Expedition[]> {
		return transaction.run<Expedition, any>(`MATCH(u:User {id: $userId}) OPTIONAL MATCH (u)-[:${ownsOnly ? 'OWNS_EXPEDITION' : 'JOINS_EXPEDITION'}]->(e:Expedition) RETURN COALESCE(properties(e), []) as e SKIP $skip LIMIT $limit`, {
			userId: user.id,
			limit: limit,
			skip: skip
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'e'));
	}
	
	export function get(transaction: Transaction, expeditionId: string): Promise<Expedition> {
		return transaction.run<Expedition, any>(`MATCH(e:Expedition {id: $expeditionId}) RETURN COALESCE(properties(e), []) as e LIMIT 1`, {
			expeditionId: expeditionId,
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'e').pop());
	}
	
	export function findByFulltext(transaction: Transaction, query: string, limit = 0, skip = 25) : Promise<Expedition[]>{
		return transaction.run<User, any>('CALL apoc.index.search("Expedition", $query) YIELD node WITH properties(node) as e RETURN e SKIP $skip LIMIT $limit', {
			query: `${query}~`,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'e'));
	}
	
	export function approveUser(transaction: Transaction, expedition: Expedition, user: User, relatedUser: User) : Promise<void> {
		return this.getOwner(transaction, expedition).then((owner: User) => {
			let relationship = '(e)-[:POSSIBLY_JOINS_EXPEDITION {creator: $relatedUserId}]->(u)';
			if(user.id == relatedUser.id) relationship = '(e)<-[:POSSIBLY_JOINS_EXPEDITION]-(u)';
			if(user.id == relatedUser.id && (owner == null || owner.id == relatedUser.id || !expedition.needsApproval)) relationship = '(e)<-[:JOINS_EXPEDITION]-(u)';
			
			// Create invitation / request.
			return transaction.run(`MATCH(e:Expedition {id : $expeditionId }), (u:User {id: $userId}) WHERE NOT (e)-[:JOINS_EXPEDITION]-(u) CREATE UNIQUE ${relationship}`, {
				expeditionId: expedition.id,
				userId: user.id,
				relatedUserId: relatedUser.id
			}).then(() => {
				// Merge matches, if owner exists.
				if(owner) return transaction.run(`MATCH(e:Expedition {id : $expeditionId })<-[pje:POSSIBLY_JOINS_EXPEDITION]->(u:User {id: $userId}) WHERE (e)-[:POSSIBLY_JOINS_EXPEDITION {creator: $ownerId}]->(u) DETACH DELETE pje WITH u, e CREATE UNIQUE (e)<-[:JOINS_EXPEDITION]-(u) WITH e, u MATCH (u)-[pje:POSSIBLY_JOINS_EXPEDITION]-(e) DETACH DELETE pje`, {
					expeditionId: expedition.id,
					userId: user.id,
					ownerId: owner.id
				}).then(() => {});
			});
		}).then(() => {});
	}
	
	export function approveAllUser(transaction: Transaction, expedition: Expedition) : Promise<void> {
		return transaction.run(`MATCH (e:Expedition {id: $expeditionId}) OPTIONAL MATCH (e)<-[pje:POSSIBLY_JOINS_EXPEDITION]-() CALL apoc.refactor.setType(pje, 'JOINS_EXPEDITION') YIELD output OPTIONAL MATCH (e)-[pje:POSSIBLY_JOINS_EXPEDITION]-() DETACH DELETE pje`, {
			expeditionId: expedition.id
		}).then(() => {});
	}
	
	export function rejectUser(transaction: Transaction, expedition: Expedition, user: User): Promise<void> {
		return transaction.run(`MATCH (:Expedition {id: $expeditionId})-[pje:POSSIBLY_JOINS_EXPEDITION:JOINS_EXPEDITION]-(:User {id: $userId}) DETACH DELETE pje`, {
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
			id: shortid.generate(),
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
		return this.save(transaction, expedition).then(() => expedition);
	}
	
	export function save(transaction: Transaction, expedition: Expedition): Promise<void> {
		// Set timestamps.
		let now = new Date().toISOString();
		if(!expedition.createdAt) expedition.createdAt = now;
		expedition.updatedAt = now;
		
		// Save.
		let promises = [
			transaction.run("MERGE (e:Expedition {id: $expedition.id}) ON CREATE SET e = $flattenExpedition ON MATCH SET e = $flattenExpedition", {
				expedition: expedition,
				flattenExpedition: DatabaseManager.neo4jFunctions.flatten(expedition)
			})
		];
		
		// Is public expedition?
		if(!expedition.needsApproval) promises.push(this.approveAllUsers(transaction, expedition));
		
		// Return nothing.
		return Promise.all(promises).then(() => {});
	}
	
	export function setOwner(transaction: Transaction, expedition: Expedition, user: User): Promise<void> {
		return transaction.run("MATCH(e:Expedition {id : $expeditionId}), (nu: User {id: $userId}) OPTIONAL MATCH (e)<-[ooe:OWNS_EXPEDITION]-(:User) DETACH DELETE ooe WITH e, nu CREATE (e)<-[noe:OWNS_EXPEDITION]-(nu)", {
			expeditionId: expedition.id,
			userId: user.id
		}).then(() => {});
	}
	
	export function getOwner(transaction: Transaction, expedition: Expedition) : Promise<User> {
		return transaction.run<User, any>("MATCH(:Expedition {id : $expeditionId })<-[:OWNS_EXPEDITION]-(u:User) RETURN COALESCE(properties(u), []) as u LIMIT 1", {
			expeditionId: expedition.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'u').pop());
	}
	
	export function getAttendees(transaction: Transaction, expedition: Expedition, skip = 0, limit = 25): Promise<User[]> {
		return transaction.run<User, any>("MATCH(:Expedition {id : $expeditionId })<-[:JOINS_EXPEDITION]-(u:User) RETURN COALESCE(properties(u), []) as u SKIP $skip LIMIT $limit", {
			expeditionId: expedition.id,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'u'));
	}
	
	export function setRudel(transaction: Transaction, expedition: Expedition, rudel: Rudel): Promise<void> {
		return transaction.run("MATCH(e:Expedition {id : $expeditionId}), (nr:Rudel {id: $rudelId}) OPTIONAL MATCH (e)-[obtr:BELONGS_TO_RUDEL]->(:Rudel) DETACH DELETE obtr WITH e, nr CREATE (e)-[nbtr:BELONGS_TO_RUDEL]->(nr)", {
			expeditionId: expedition.id,
			rudelId: rudel.id
		}).then(() => {});
	}
	
	export function getRudel(transaction: Transaction, expedition: Expedition): Promise<Rudel> {
		return transaction.run<Rudel, any>("MATCH(:Expedition {id : $expeditionId })-[:BELONGS_TO_RUDEL]->(r:Rudel) RETURN COALESCE(properties(r), []) as r LIMIT 1", {
			expeditionId: expedition.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'r').pop());
	}
	
	export function getNearbyExpeditions(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Expedition[]> {
		return transaction.run<Expedition, any>("MATCH(e:Expedition) WITH e ORDER BY distance(point($location), point(e.location)) RETURN properties(e) as e SKIP $skip LIMIT $limit", {
			location: dot.transform({
				'lat': 'latitude',
				'lng': 'longitude'
			}, user.location),
			limit: limit,
			skip: skip
		}).then(results => {
			return DatabaseManager.neo4jFunctions.unflatten(results.records, 'e');
		});
	}
	
	export function getNearbyExpeditionsWithinRudel(transaction: Transaction, user: User, rudel: Rudel, skip = 0, limit = 25): Promise<Expedition[]> {
		return transaction.run<Expedition, any>("MATCH(r:Rudel {id: $rudelId}) WITH r MATCH (e:Expedition)-[:BELONGS_TO_RUDEL]->(r) WITH e ORDER BY distance(point($location), point(e.location)) WITH properties(e) as e RETURN e SKIP $skip LIMIT $limit", {
			location: dot.transform({
				'lat': 'latitude',
				'lng': 'longitude'
			}, user.location),
			rudelId: rudel.id,
			limit: limit,
			skip: skip
		}).then(results => {
			return DatabaseManager.neo4jFunctions.unflatten(results.records, 'e')
		});
	}
	
	export function isAttendee(transaction: Transaction, expedition: Expedition, user: User): Promise<boolean> {
		return transaction.run<Expedition, any>("MATCH(e:Expedition {id : $expeditionId }), (u:User {id: $userId}) OPTIONAL MATCH (e)<-[je:JOINS_EXPEDITION]-(u) RETURN COUNT(je) > 0 as je", {
			expeditionId: expedition.id,
			userId: user.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'je').pop());
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
						ExpeditionController.approveUser(transaction, expedition, request.auth.credentials, request.auth.credentials),
						ExpeditionController.setRudel(transaction, expedition, rudel)
					]).then(() => expedition);
				}).then((expedition: Expedition) => ExpeditionController.getPublicExpedition(transaction, expedition, request.auth.credentials));
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/=/{id}
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function get(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.get(transaction, request.params.id).then((expedition: Expedition) => {
				if (!expedition) return Promise.reject(Boom.notFound('Expedition not found.'));
				return ExpeditionController.getPublicExpedition(transaction, expedition, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/=/{id}/attendees/{offset?}
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.params.offset offset (optional, default=0)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getAttendees(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.get(transaction, request.params.id).then((expedition: Expedition) => {
				if (!expedition) return Promise.reject(Boom.notFound('Expedition not found.'));
				return ExpeditionController.getAttendees(transaction, expedition, request.params.offset);
			}).then((users: User[]) => {
				return UserController.getPublicUser(transaction, users, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/=/{id}/approve/{username}
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.params.username username
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function approveUser(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = Promise.all([
				ExpeditionController.get(transaction, request.params.id),
				request.params.username == 'me' ? Promise.resolve(request.auth.credentials) : UserController.findByUsername(transaction, request.params.username)
			]).then((values: [Expedition, User]) => {
				if (!values[0]) return Promise.reject(Boom.notFound('Expedition not found.'));
				if (!values[1]) return Promise.reject(Boom.notFound('User not found.'));
				return ExpeditionController.approveUser(transaction, values[0], values[1], request.auth.credentials).then(() => values[0]);
			}).then((expedition: Expedition) => {
				return ExpeditionController.getPublicExpedition(transaction, expedition, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/=/{id}/reject/{username}
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.params.username username
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function rejectUser(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = Promise.all([
				ExpeditionController.get(transaction, request.params.id),
				request.params.username == 'me' ? Promise.resolve(request.auth.credentials) : UserController.findByUsername(transaction, request.params.username)
			]).then((values: [Expedition, User]) => {
				if (!values[0]) return Promise.reject(Boom.notFound('Expedition not found.'));
				if (!values[1]) return Promise.reject(Boom.notFound('User not found.'));
			
				return ExpeditionController.getOwner(transaction, values[0]).then((owner: User) => {
					if(owner.id != request.auth.credentials.id) return Promise.reject(Boom.forbidden('You do not have enough privileges to perform this operation.'));
					return ExpeditionController.rejectUser(transaction, values[0], values[1]).then(() => values[0]);
				});
			}).then((expedition: Expedition) => {
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
			let promise: Promise<any[]> = ExpeditionController.findByFulltext(request.params.query, request.params.offset).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/by/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.params.offset offset (default=0)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function by(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then(user => {
				if(!user) return Promise.reject(Boom.notFound('User not found!'));
				return ExpeditionController.findByUser(transaction, user, request.params.offset);
			}).then((expeditions: Expedition[]) => ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/nearby/{offset?}
		 * @param request Request-Object
		 * @param request.params.offset offset (default=0)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function nearby(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.getNearbyExpeditions(transaction, request.auth.credentials, request.params.offset).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/near/{rudel}/{offset?}
		 * @param request Request-Object
		 * @param request.params.offset offset (default=0)
		 * @param request.params.rudel rudel
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function nearbyWithinRudel(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.rudel).then((rudel: Rudel) => {
				if(!rudel) return Promise.reject(Boom.notFound('Rudel not found!'));
				return ExpeditionController.getNearbyExpeditionsWithinRudel(transaction, request.auth.credentials, rudel, request.params.offset);
			}).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
	}
}
