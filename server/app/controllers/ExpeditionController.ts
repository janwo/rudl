import * as Boom from 'boom';
import * as dot from 'dot-object';
import {DatabaseManager, TransactionSession} from '../Database';
import {Rudel} from '../models/rudel/Rudel';
import {User} from '../models/user/User';
import {Expedition} from '../models/expedition/Expedition';
import {UserController} from './UserController';
import * as moment from 'moment';
import {UtilController} from './UtilController';
import * as Random from 'random-seed';
import * as shortid from 'shortid';
import {Config} from '../../../run/config';
import {ExpeditionRecipe} from '../../../client/app/models/expedition';
import Transaction from 'neo4j-driver/lib/v1/transaction';
import {RudelController} from './RudelController';

export module ExpeditionController {
	
	export const FUZZY_HOURS = 3;
	export const FUZZY_METERS = 500;
	
	export function getPublicExpedition(transaction: Transaction, expedition: Expedition | Expedition[], relatedUser: User): Promise<any | any[]> {
		let createPublicExpedition = (expedition: Expedition): Promise<any> => {
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
				let dateAccuracy = 0;
				let locationAccuracy = 0;
				if (expedition.needsApproval && !values[2].isAttendee) {
					// Seedable randomness to prevent hijacking unmasked data by recalling this function multiple times.
					let randomSeed: Random.RandomSeed = Random.create(expedition.id + Config.backend.salts.random);
					
					// Mask time.
					if (expedition.fuzzyTime) {
						dateAccuracy = ExpeditionController.FUZZY_HOURS * 3600;
						moment(expedition.date).add(randomSeed.intBetween(-FUZZY_HOURS, FUZZY_HOURS), 'hours').minute(0).second(0).millisecond(0);
					}
					
					// Mask location.
					locationAccuracy = ExpeditionController.FUZZY_METERS;
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
					locationAccuracy: locationAccuracy,
					dateAccuracy: dateAccuracy,
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
	
	export function getStatistics(transaction: Transaction, expedition: Expedition, relatedUser: User): Promise<ExpeditionStatistics> {
		// Set queries.
		let queries: string[] = [
			"MATCH (expedition:Expedition {id: $expeditionId}), (relatedUser:User {id: $relatedUserId})",
			"OPTIONAL MATCH (expedition)<-[je:JOINS_EXPEDITION]-() WITH COUNT(je) as attendees, expedition, relatedUser",
			"OPTIONAL MATCH (expedition)-[pje:POSSIBLY_JOINS_EXPEDITION]->() WITH attendees, COUNT(pje) as invitees, expedition, relatedUser",
			"OPTIONAL MATCH (expedition)<-[pje:POSSIBLY_JOINS_EXPEDITION]-() WITH attendees, invitees, COUNT(pje) as applicants, expedition, relatedUser",
			"OPTIONAL MATCH (expedition)<-[je:JOINS_EXPEDITION]-(relatedUser) WITH attendees, invitees, applicants, COUNT(je) > 0 as isAttendee, expedition, relatedUser",
			"OPTIONAL MATCH (expedition)-[pje:POSSIBLY_JOINS_EXPEDITION]->(relatedUser) WITH attendees, invitees, applicants, isAttendee, COUNT(pje) > 0 as isInvitee, expedition, relatedUser",
			"OPTIONAL MATCH (expedition)<-[pje:POSSIBLY_JOINS_EXPEDITION]-(relatedUser) WITH attendees, invitees, applicants, isAttendee, isInvitee, COUNT(pje) > 0 as isApplicant, expedition, relatedUser"
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
			relatedUserId: relatedUser ? relatedUser.id : null
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 0).pop());
	}
	
	export function findByUser(transaction: Transaction, user: User, ownsOnly = false, skip = 0, limit = 25): Promise<Expedition[]> {
		return transaction.run<Expedition, any>(`MATCH(u:User {id: $userId}) OPTIONAL MATCH (u)-[:${ownsOnly ? 'OWNS_EXPEDITION' : 'JOINS_EXPEDITION'}]->(e:Expedition) RETURN COALESCE(properties(e), []) as e SKIP $skip LIMIT $limit`, {
			userId: user.id,
			limit: limit,
			skip: skip
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'e'));
	}
	
	export function get(transaction: Transaction, expeditionId: string): Promise<Expedition> {
		return transaction.run<Expedition, any>(`MATCH(e:Expedition {id: $expeditionId}) RETURN COALESCE(properties(e), []) as e LIMIT 1`, {
			expeditionId: expeditionId
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'e').pop());
	}
	
	export function findByFulltext(transaction: Transaction, query: string, limit = 0, skip = 25): Promise<Expedition[]> {
		return transaction.run<User, any>('CALL apoc.index.search("Expedition", $query) YIELD node WITH properties(node) as e RETURN e SKIP $skip LIMIT $limit', {
			query: `${DatabaseManager.neo4jFunctions.escapeLucene(query)}~`,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'e'));
	}
	
	export function approveUser(transaction: Transaction, expedition: Expedition, user: User, relatedUser: User): Promise<void> {
		return this.getOwner(transaction, expedition).then((owner: User) => {
			let query = `MATCH(e:Expedition {id : $expeditionId }), (u:User {id: $userId}), (r:Rudel)<-[:BELONGS_TO_RUDEL]-(e) WHERE NOT (e)-[:JOINS_EXPEDITION]-(u) WITH e, u, r CREATE UNIQUE (e)<-[:JOINS_EXPEDITION {createdAt: $now}]-(u)-[:FOLLOWS_RUDEL]->(r) WITH e, u MATCH (u)-[pje:POSSIBLY_JOINS_EXPEDITION]-(e) DETACH DELETE pje`;
			if (owner && owner.id != user.id && relatedUser.id == owner.id) query = `MATCH(e:Expedition {id : $expeditionId }), (u:User {id: $userId}) WHERE NOT (e)-[:JOINS_EXPEDITION]-(u) CREATE UNIQUE (e)-[:POSSIBLY_JOINS_EXPEDITION {createdAt: $now}]->(u)`;
			if (owner && owner.id != user.id && expedition.needsApproval) {
				let possibleRelationship = relatedUser.id == owner.id ? '(e)-[:POSSIBLY_JOINS_EXPEDITION {createdAt: $now}]->(u)' : '(e)<-[:POSSIBLY_JOINS_EXPEDITION {createdAt: $now}]-(u)';
				query = `MATCH(e:Expedition {id : $expeditionId }), (u:User {id: $userId}), (r:Rudel)<-[:BELONGS_TO_RUDEL]-(e) WHERE NOT (e)-[:JOINS_EXPEDITION]-(u) OR NOT ${possibleRelationship} CREATE UNIQUE ${possibleRelationship}` +
					` WITH e, u, r MATCH (e)-[pje:POSSIBLY_JOINS_EXPEDITION]-(u) WHERE (e)<-[:POSSIBLY_JOINS_EXPEDITION]-(u) AND (e)-[:POSSIBLY_JOINS_EXPEDITION]->(u) DETACH DELETE pje WITH u, r, e CREATE UNIQUE (e)<-[:JOINS_EXPEDITION {createdAt: $now}]-(u)-[:FOLLOWS_RUDEL]->(r)`;
			}
			
			// Make invitation / request.
			return transaction.run(query, {
				expeditionId: expedition.id,
				userId: user.id,
				now: new Date().toISOString()
			});
		}).then(() => {});
	}
	
	export function approveAllUsers(transaction: Transaction, expedition: Expedition): Promise<void> {
		return transaction.run(`MATCH (e:Expedition {id: $expeditionId})<-[pje:POSSIBLY_JOINS_EXPEDITION]-() SET pje.createdAt = $now WITH pje CALL apoc.refactor.setType(pje, 'JOINS_EXPEDITION') YIELD output RETURN {}`, {
			expeditionId: expedition.id,
			now: new Date().toISOString()
		}).then(() => {});
	}
	
	export function rejectUser(transaction: Transaction, expedition: Expedition, user: User): Promise<void> {
		return transaction.run(`MATCH (e:Expedition {id: $expeditionId}), (u:User {id: $userId}) WITH u, e OPTIONAL MATCH (e)-[pje:POSSIBLY_JOINS_EXPEDITION]-(u) OPTIONAL MATCH (e)-[je:JOINS_EXPEDITION]-(u) OPTIONAL MATCH (e)<-[:BELONGS_TO_NODE]-(c:Comment)<-[:OWNS_COMMENT]-(u) DETACH DELETE c, pje, je`, {
			expeditionId: expedition.id,
			userId: user.id
		}).then(() => {});
	}
	
	export interface AttendeeStatus {
		isApplicant: boolean;
		isAttendee: boolean;
		isInvitee: boolean;
	}
	
	export function getAttendeeStatus(transaction: Transaction, expedition: Expedition, user: User): Promise<AttendeeStatus> {
		return transaction.run(`MATCH (e:Expedition {id: $expeditionId}), (u:User {id: $userId}) WITH u, e OPTIONAL MATCH(u)<-[invitee:POSSIBLY_JOINS_EXPEDITION]-(e) OPTIONAL MATCH(u)-[attendee:JOINS_EXPEDITION]->(e) OPTIONAL MATCH(u)-[applicant:POSSIBLY_JOINS_EXPEDITION]->(e) RETURN {isInvitee: COUNT(invitee) > 0, isApplicant: COUNT(applicant) > 0, isAttendee: COUNT(attendee) > 0} as as`, {
			expeditionId: expedition.id,
			userId: user.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'as').pop());
	}
	
	export function removeExpeditions(transaction: Transaction, rudel: Rudel, user: User = null): Promise<void> {
		// Delete all expeditions of an user within an rudel.
		if(user) return transaction.run(`MATCH(:Rudel {id: $rudelId})<-[:BELONGS_TO_RUDEL]-(e:Expedition)<-[:OWNS_EXPEDITION]-(:User {id: $userId}) OPTIONAL MATCH (e)<-[:BELONGS_TO_NODE]-(c:Comment) CALL apoc.index.removeNodeByName('Expedition', e) DETACH DELETE e, c`, {
			rudelId: rudel.id,
			userId: user.id
		}).then(() => {});
		
		// Delete all expeditions of an rudel.
		return transaction.run(`MATCH(:Rudel {id: $rudelId})<-[:BELONGS_TO_RUDEL]-(e:Expedition) OPTIONAL MATCH (e)<-[:BELONGS_TO_NODE]-(c:Comment) CALL apoc.index.removeNodeByName('Expedition', e) DETACH DELETE e, c`, {
			rudelId: rudel.id
		}).then(() => {});
	}
	
	export function removeExpedition(transaction: Transaction, expedition: Expedition): Promise<void> {
		return transaction.run(`MATCH(e:Expedition {id: $expeditionId}) OPTIONAL MATCH (e)<-[:BELONGS_TO_NODE]-(c:Comment) CALL apoc.index.removeNodeByName('Expedition', e) DETACH DELETE e, c`, {
			expeditionId: expedition.id
		}).then(() => {});
	}
	
	export function create(transaction: Transaction, recipe: ExpeditionRecipe): Promise<Expedition> {
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
		if (!expedition.createdAt) expedition.createdAt = now;
		expedition.updatedAt = now;
		
		// Save.
		let promises: Promise<any>[] = [
			transaction.run("MERGE (e:Expedition {id: $expedition.id}) ON CREATE SET e = $flattenExpedition ON MATCH SET e = $flattenExpedition", {
				expedition: expedition,
				flattenExpedition: DatabaseManager.neo4jFunctions.flatten(expedition)
			})
		];
		
		// Is public expedition?
		if (!expedition.needsApproval) promises.push(ExpeditionController.approveAllUsers(transaction, expedition));
		
		// Return nothing.
		return Promise.all(promises).then(() => {});
	}
	
	export function setOwner(transaction: Transaction, expedition: Expedition, user: User): Promise<void> {
		return transaction.run("MATCH(e:Expedition {id : $expeditionId}), (nu: User {id: $userId}) OPTIONAL MATCH (e)<-[ooe:OWNS_EXPEDITION]-(:User) DETACH DELETE ooe WITH e, nu CREATE (e)<-[noe:OWNS_EXPEDITION]-(nu)", {
			expeditionId: expedition.id,
			userId: user.id
		}).then(() => {});
	}
	
	export function getOwner(transaction: Transaction, expedition: Expedition): Promise<User> {
		return transaction.run<User, any>("MATCH(:Expedition {id : $expeditionId })<-[:OWNS_EXPEDITION]-(u:User) RETURN COALESCE(properties(u), []) as u LIMIT 1", {
			expeditionId: expedition.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'u').pop());
	}
	
	export function getAttendees(transaction: Transaction, expedition: Expedition, skip = 0, limit = 25): Promise<{
		status: AttendeeStatus,
		user: User
	}[]> {
		return transaction.run<User, any>(`MATCH(e:Expedition {id : $expeditionId})-[pje]-(u:User) WHERE (e)-[:POSSIBLY_JOINS_EXPEDITION]-(u) OR (e)-[:JOINS_EXPEDITION]-(u) WITH e, u, apoc.date.parse(pje.createdAt, "s", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") as date OPTIONAL MATCH(u)<-[invitee:POSSIBLY_JOINS_EXPEDITION]-(e) OPTIONAL MATCH(u)-[attendee:JOINS_EXPEDITION]->(e) OPTIONAL MATCH(u)-[applicant:POSSIBLY_JOINS_EXPEDITION]->(e) WITH u, invitee, attendee, applicant, date ORDER BY date DESC RETURN {user: properties(u), status: {isInvitee: COUNT(invitee) > 0, isApplicant: COUNT(applicant) > 0, isAttendee: COUNT(attendee) > 0}} as u SKIP $skip LIMIT $limit`, {
			expeditionId: expedition.id,
			skip: skip,
			limit: limit
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'u'));
	}
	
	export function inviteLike(transaction: Transaction, expedition: Expedition, query: string, relatedUser: User, skip = 0, limit = 25): Promise<{
		status: AttendeeStatus,
		user: User
	}[]> {
		return transaction.run<User, any>("MATCH(e:Expedition {id : $expeditionId}), (relatedUser:User {id: $relatedUserId}) WITH relatedUser, e CALL apoc.index.search('User', $query) YIELD node WITH node as u, e, relatedUser WHERE (u)-[:FOLLOWS_USER]->(relatedUser) OPTIONAL MATCH(u)<-[invitee:POSSIBLY_JOINS_EXPEDITION]-(e) OPTIONAL MATCH(u)-[attendee:JOINS_EXPEDITION]->(e) OPTIONAL MATCH(u)-[applicant:POSSIBLY_JOINS_EXPEDITION]->(e) RETURN {user: properties(u), status: {isInvitee: COUNT(invitee) > 0, isApplicant: COUNT(applicant) > 0, isAttendee: COUNT(attendee) > 0}} as u SKIP $skip LIMIT $limit", {
			expeditionId: expedition.id,
			query: `${DatabaseManager.neo4jFunctions.escapeLucene(query)}~`,
			relatedUserId: relatedUser.id,
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
			return DatabaseManager.neo4jFunctions.unflatten(results.records, 'e');
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
				if (!rudel) return Promise.reject(Boom.badRequest('Rudel does not exist!'));
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
		 * Handles [GET] /api/expeditions/=/{id}/invite-like/{query}
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.params.query query
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function inviteLike(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.get(transaction, request.params.id).then((expedition: Expedition) => {
				if (!expedition) return Promise.reject(Boom.notFound('Expedition not found.'));
				return ExpeditionController.inviteLike(transaction, expedition, request.params.query, request.auth.credentials, request.query.offset, request.query.limit);
			}).then((inviteLikeItems: {
				status: AttendeeStatus,
				user: User
			}[]) => {
				return UserController.getPublicUser(transaction, inviteLikeItems.map(inviteLikeItem => inviteLikeItem.user), request.auth.credentials).then(user => {
					return inviteLikeItems.map((inviteLikeItem: any, index: number) => {
						inviteLikeItem.user = user[index];
						return inviteLikeItem;
					});
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/=/{id}/attendees
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getAttendees(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.get(transaction, request.params.id).then((expedition: Expedition) => {
				if (!expedition) return Promise.reject(Boom.notFound('Expedition not found.'));
				return ExpeditionController.getAttendees(transaction, expedition, request.query.offset, request.query.limit);
			}).then((attendees: {
				status: AttendeeStatus,
				user: User
			}[]) => {
				return UserController.getPublicUser(transaction, attendees.map(attendee => attendee.user), request.auth.credentials).then(user => {
					return attendees.map((attendee: {
						status: AttendeeStatus,
						user: User
					}, index: number) => {
						attendee.user = user[index];
						console.log(attendee);
						return attendee;
					});
				});
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
				return ExpeditionController.approveUser(transaction, values[0], values[1], request.auth.credentials).then(() => {
					return Promise.all([
						ExpeditionController.getAttendeeStatus(transaction, values[0], values[1]),
						UserController.getPublicUser(transaction, values[1], request.auth.credentials),
						ExpeditionController.getPublicExpedition(transaction, values[0], request.auth.credentials)
					]).then((values: [AttendeeStatus, User, Expedition]) => {
						return {
							status: values[0],
							user: values[1],
							expedition: values[2]
						};
					});
				});
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
					if (owner.id == request.auth.credentials.id && values[1].id == owner.id) return ExpeditionController.removeExpedition(transaction, values[0]).then(() => {});
					if (owner.id == request.auth.credentials.id || values[1].id == request.auth.credentials.id) return ExpeditionController.rejectUser(transaction, values[0], values[1]).then(() => {
						return Promise.all([
							ExpeditionController.getAttendeeStatus(transaction, values[0], values[1]),
							UserController.getPublicUser(transaction, values[1], request.auth.credentials),
							ExpeditionController.getPublicExpedition(transaction, values[0], request.auth.credentials)
						]).then((values: [AttendeeStatus, User, Expedition]) => {
							return {
								status: values[0],
								user: values[1],
								expedition: values[2]
							};
						});
					});
					return Promise.reject(Boom.forbidden('You do not have enough privileges to perform this operation.'));
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/like/{query}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function like(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any[]> = ExpeditionController.findByFulltext(request.params.query, request.query.offset, request.query.limit).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/by/{username}
		 * @param request Request-Object
		 * @param request.params.username username
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function by(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = Promise.resolve(request.params.username != 'me' ? UserController.findByUsername(transaction, request.params.username) : request.auth.credentials).then(user => {
				if (!user) return Promise.reject(Boom.notFound('User not found!'));
				return ExpeditionController.findByUser(transaction, user, false, request.query.offset, request.query.limit);
			}).then((expeditions: Expedition[]) => ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials));
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/nearby
		 * @param request Request-Object
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function nearby(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.getNearbyExpeditions(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/near/{rudel}
		 * @param request Request-Object
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.params.rudel rudel
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function nearbyWithinRudel(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.rudel).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.notFound('Rudel not found!'));
				return ExpeditionController.getNearbyExpeditionsWithinRudel(transaction, request.auth.credentials, rudel, request.query.offset, request.query.limit);
			}).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
	}
}
