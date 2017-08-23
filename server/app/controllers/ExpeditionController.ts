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
import Transaction from 'neo4j-driver/types/v1/transaction';
import {RudelController} from './RudelController';
import {AccountController} from './AccountController';
import {StatementResult} from 'neo4j-driver/types/v1/result';
import {NotificationType} from '../models/notification/Notification';
import {CommentController} from './CommentController';

export module ExpeditionController {
	
	export const FUZZY_HOURS = 3;
	export const FUZZY_METERS = 500;
	export const SEARCH_RADIUS_METERS = 30000;
	
	export function getPublicExpedition(transaction: Transaction, expedition: Expedition | Expedition[], relatedUser: User, preview = false): Promise<any | any[]> {
		let createPublicExpedition = (expedition: Expedition): Promise<any> => {
			// Gather expedition information.
			let promise = ((): Promise<[User, any, ExpeditionStatistics, Rudel]> => {
				if(!preview) {
					let expeditionOwnerPromise = ExpeditionController.getOwner(transaction, expedition);
					let publicExpeditionOwnerPromise = expeditionOwnerPromise.then((owner: User) => {
						return UserController.getPublicUser(transaction, owner, relatedUser);
					});
					let expeditionStatisticsPromise = ExpeditionController.getStatistics(transaction, expedition, relatedUser);
					let rudelPromise = ExpeditionController.getRudel(transaction, expedition).then((rudel: Rudel) => {
						return RudelController.getPublicRudel(transaction, rudel, relatedUser, true);
					});
					return Promise.all([
						expeditionOwnerPromise,
						publicExpeditionOwnerPromise,
						expeditionStatisticsPromise,
						rudelPromise
					]);
				}
				return Promise.resolve([]) as Promise<[User, any, ExpeditionStatistics, Rudel]>;
			})();
			
			// Modify expedition information.
			return promise.then(values => {
				// Add default links.
				let links = {
					icon: UtilController.getIconUrl(expedition.icon)
				};
				
				let transformationRecipe = {
					'expedition.id': 'id',
					'expedition.title': 'title',
					'expedition.description': 'description',
					'expedition.icon': 'icon',
					'createdAt': 'createdAt',
					'updatedAt': 'updatedAt',
					'links': 'links'
				};
				
				let transformationObject = {
					expedition: expedition,
					links: links,
					createdAt: UtilController.isoDate(expedition.createdAt),
					updatedAt: UtilController.isoDate(expedition.updatedAt)
				};
				
				// Emit extended information.
				if (!preview) {
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
						let dlatitude = distance / R;
						let dlongitude = distance / ( R * Math.cos(pi * expedition.location.longitude / 180) );
						expedition.location.latitude = expedition.location.latitude + ( dlatitude * 180 / pi );
						expedition.location.longitude = expedition.location.longitude + ( dlongitude * 180 / pi );
					}
					
					// Extend transformation recipe.
					transformationRecipe = Object.assign(transformationRecipe, {
						'isoDateString': 'date.isoString',
						'dateAccuracy': 'date.accuracy',
						'expedition.needsApproval': 'needsApproval',
						'expedition.location': 'location',
						"locationAccuracy": "location.accuracy",
						"rudel": "rudel",
						'owner': 'owner',
						'isOwner': 'relations.isOwned',
						'statistics.attendees': 'statistics.attendees',
						'statistics.invitees': 'statistics.invitees',
						'statistics.applicants': 'statistics.applicants',
						'statistics.isAttendee': 'relations.isAttendee',
						'statistics.isInvitee': 'relations.isInvitee',
						'statistics.isApplicant': 'relations.isApplicant'
					});
					
					// Extend transformation object.
					transformationObject = Object.assign(transformationObject, {
						locationAccuracy: locationAccuracy,
						dateAccuracy: dateAccuracy,
						statistics: values[2],
						rudel: values[3],
						isoDateString: UtilController.isoDate(expedition.date),
						owner: values[1],
						isOwner: values[0].id == relatedUser.id
					});
				}
				
				// Build profile.
				return Promise.resolve(dot.transform(transformationRecipe, transformationObject));
			});
		};

		let transformed = expedition instanceof Array ? Promise.all(expedition.map(createPublicExpedition)) : createPublicExpedition(expedition);
		return transformed.then((result: any | Array<any>) => result);
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
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 0).shift());
	}
	
	export function findUpcomingByUser(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Expedition[]> {
		return transaction.run(`MATCH(u:User {id: $userId}) OPTIONAL MATCH (u)-[:JOINS_EXPEDITION]->(e:Expedition) WITH e WHERE e.date > $after WITH e ORDER BY e.date SKIP $skip LIMIT $limit RETURN COALESCE(properties(e), []) as e`, {
			userId: user.id,
			limit: limit,
			skip: skip,
			after: new Date().getTime() / 1000 - 43200
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'e'));
	}
	
	export function findDoneByUser(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Expedition[]> {
		return transaction.run(`MATCH(u:User {id: $userId}) OPTIONAL MATCH (u)-[:JOINS_EXPEDITION]->(e:Expedition) WITH e WHERE e.date < $before WITH e ORDER BY e.date DESC SKIP $skip LIMIT $limit RETURN COALESCE(properties(e), []) as e`, {
			userId: user.id,
			limit: limit,
			skip: skip,
			before: new Date().getTime() / 1000 + 43200
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'e'));
	}
	
	export function findUpcomingByRudel(transaction: Transaction, rudel: Rudel, user: User, skip = 0, limit = 25): Promise<Expedition[]> {
		return transaction.run(`MATCH(r:Rudel {id: $rudelId}) WITH r CALL spatial.withinDistance("Expedition", $location, ${SEARCH_RADIUS_METERS / 1000}) YIELD node as e WITH r, e WHERE (r)<-[:BELONGS_TO_RUDEL]-(e) AND e.date > $after WITH e ORDER BY e.date SKIP $skip LIMIT $limit RETURN COALESCE(properties(e), []) as e`, {
			rudelId: rudel.id,
			location: {
				latitude: user.location.latitude,
				longitude: user.location.longitude
			},
			limit: limit,
			skip: skip,
			after: new Date().getTime() / 1000 - 43200
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'e'));
	}
	
	export function findDoneByRudel(transaction: Transaction, rudel: Rudel, user: User, skip = 0, limit = 25): Promise<Expedition[]> {
		return transaction.run(`MATCH(r:Rudel {id: $rudelId}) WITH r CALL spatial.withinDistance("Expedition", $location, ${SEARCH_RADIUS_METERS / 1000}) YIELD node as e WITH r, e WHERE (r)<-[:BELONGS_TO_RUDEL]-(e) AND e.date < $before WITH e ORDER BY e.date DESC SKIP $skip LIMIT $limit RETURN COALESCE(properties(e), []) as e`, {
			rudelId: rudel.id,
			location: {
				latitude: user.location.latitude,
				longitude: user.location.longitude
			},
			limit: limit,
			skip: skip,
			before: new Date().getTime() / 1000 + 43200
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'e'));
	}
	
	export function get(transaction: Transaction, expeditionId: string): Promise<Expedition> {
		return transaction.run(`MATCH(e:Expedition {id: $expeditionId}) RETURN COALESCE(properties(e), []) as e LIMIT 1`, {
			expeditionId: expeditionId
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'e').shift());
	}
	
	export function findByFulltext(transaction: Transaction, query: string, limit = 0, skip = 25): Promise<Expedition[]> {
		return transaction.run('CALL apoc.index.search("Expedition", $query) YIELD node WITH properties(node) as e RETURN e SKIP $skip LIMIT $limit', {
			query: `${DatabaseManager.neo4jFunctions.escapeLucene(query)}~`,
			skip: skip,
			limit: limit
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'e'));
	}
	
	export function approveUser(transaction: Transaction, expedition: Expedition, user: User, relatedUser: User): Promise<void> {
		return this.getOwner(transaction, expedition).then((owner: User) => {
			// Add initial owner.
			if (!owner || owner.id == user.id) {
				let query = `MATCH(e:Expedition {id : $expeditionId }), (u:User {id: $userId}), (r:Rudel)<-[:BELONGS_TO_RUDEL]-(e)
				WHERE NOT (e)-[:JOINS_EXPEDITION]-(u)
				WITH e, u, r
				CREATE UNIQUE (e)<-[:JOINS_EXPEDITION {createdAt: $now}]-(u)-[:LIKES_RUDEL]->(r)
				WITH e, u
				MATCH (u)-[pje:POSSIBLY_JOINS_EXPEDITION]-(e)
				DETACH DELETE pje`;
				return transaction.run(query, {
					expeditionId: expedition.id,
					userId: user.id,
					now: new Date().getTime() / 1000
				});
			}
			
			// Find matching possible joins.
			let findJoins = (): Promise<boolean> => {
				let query = `MATCH(e:Expedition {id : $expeditionId }), (u:User {id: $userId}), (r:Rudel)<-[:BELONGS_TO_RUDEL]-(e)
						WHERE NOT (e)<-[:JOINS_EXPEDITION]-(u)
						WITH u, r, e
						MATCH (e)-[pje:POSSIBLY_JOINS_EXPEDITION]-(u)
						WHERE (e)<-[:POSSIBLY_JOINS_EXPEDITION]-(u) AND (e)-[:POSSIBLY_JOINS_EXPEDITION]->(u)
						DETACH DELETE pje
						WITH u, r, e
						CREATE UNIQUE (e)<-[:JOINS_EXPEDITION {createdAt: $now}]-(u)-[:LIKES_RUDEL]->(r)
						WITH u, r OPTIONAL MATCH (u)-[dlr:DISLIKES_RUDEL]->(r)
						DETACH DELETE dlr`;
				return transaction.run(query, {
					expeditionId: expedition.id,
					userId: user.id,
					now: new Date().getTime() / 1000
				}).then((result: StatementResult) => (result.summary.counters.relationshipsCreated() as any as number) > 0);
			};
			
			let inviteUser = (): Promise<boolean> => {
				let query = `MATCH(e:Expedition {id : $expeditionId }), (u:User {id: $userId})
				WHERE NOT (e)-[:JOINS_EXPEDITION]-(u) AND NOT (e)-[:POSSIBLY_JOINS_EXPEDITION]->(u)
				CREATE UNIQUE (e)-[:POSSIBLY_JOINS_EXPEDITION {createdAt: $now}]->(u)`;
				return transaction.run(query, {
					expeditionId: expedition.id,
					userId: user.id,
					now: new Date().getTime() / 1000
				}).then((result: StatementResult) => (result.summary.counters.relationshipsCreated() as any as number) > 0);
			};
			
			let addUser = (): Promise<boolean> => {
				let query = `MATCH(e:Expedition {id : $expeditionId }), (u:User {id: $userId}), (r:Rudel)<-[:BELONGS_TO_RUDEL]-(e)
				WHERE NOT (e)<-[:JOINS_EXPEDITION]-(u) AND NOT (e)<-[:POSSIBLY_JOINS_EXPEDITION]-(u)
				CREATE UNIQUE (e)<-[:POSSIBLY_JOINS_EXPEDITION {createdAt: $now}]-(u)-[:LIKES_RUDEL]->(r)
				WITH u, r
				OPTIONAL MATCH (u)-[dlr:DISLIKES_RUDEL]->(r)
				DETACH DELETE dlr`;
				return transaction.run(query, {
					expeditionId: expedition.id,
					userId: user.id,
					now: new Date().getTime() / 1000
				}).then((result: StatementResult) => (result.summary.counters.relationshipsCreated() as any as number) > 0);
			};
			
			// If owner is approving someone...
			if (relatedUser.id == owner.id) {
				return inviteUser().then(invited => {
					return findJoins().then(accepted => {
						if(invited || accepted) return AccountController.NotificationController.set(
							transaction,
							accepted ? NotificationType.ACCEPTED_APPLICATION_FOR_EXPEDITION : NotificationType.INVITED_TO_EXPEDITION,
							[user],
							expedition,
							relatedUser
						);
					});
				});
			}
			
			// If a non-owner is approving himself.
			if (user.id == relatedUser.id) {
				return addUser().then(applied => {
					return Promise.resolve(expedition.needsApproval ? findJoins() : inviteUser().then(() => findJoins())).then(joined => {
						if (applied || joined) return AccountController.NotificationController.set(
							transaction,
							joined ? (expedition.needsApproval ? NotificationType.ACCEPTED_INVITATION_FOR_EXPEDITION : NotificationType.JOINED_EXPEDITION ) : NotificationType.APPLIED_FOR_EXPEDITION,
							[owner],
							expedition,
							relatedUser
						);
					});
				});
			}
		});
	}
	
	export function approveAllUsers(transaction: Transaction, expedition: Expedition): Promise<void> {
		//TODO Notifications
		return transaction.run(`MATCH (e:Expedition {id: $expeditionId})<-[pje:POSSIBLY_JOINS_EXPEDITION]-()
		SET pje.createdAt = $now
		WITH pje
		CALL apoc.refactor.setType(pje, 'JOINS_EXPEDITION') YIELD output
		RETURN {}`, {
			expeditionId: expedition.id,
			now: new Date().getTime() / 1000
		}).then(() => {});
	}
	
	export function rejectUser(transaction: Transaction, expedition: Expedition, user: User, relatedUser: User): Promise<boolean> {
		return this.getOwner(transaction, expedition).then((owner: User) => {
			if(owner.id == relatedUser.id) {
				return transaction.run(`MATCH (e:Expedition {id: $expeditionId}), (u:User {id: $userId})
				WITH u, e
				OPTIONAL MATCH (e)<-[pje:POSSIBLY_JOINS_EXPEDITION]-(u)
				OPTIONAL MATCH (e)-[pjeAll:POSSIBLY_JOINS_EXPEDITION]-(u)
				OPTIONAL MATCH (e)<-[je:JOINS_EXPEDITION]-(u)
				OPTIONAL MATCH (e)<-[:BELONGS_TO_NODE]-(c:Comment)<-[:OWNS_COMMENT]-(u)
				DETACH DELETE c, pjeAll, pje, je
				WITH count(pje) > 0 as applied, count(je) > 0 as joined
				RETURN {applied: applied, joined: joined} as deleted`, {
					expeditionId: expedition.id,
					userId: user.id
				}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'deleted').shift()).then((deleted: any) => {
					if(deleted.joined || deleted.applied) return AccountController.NotificationController.set(
						transaction,
						deleted.joined ? NotificationType.REJECTED_FROM_EXPEDITION : NotificationType.REJECTED_APPLICATION_FOR_EXPEDITION,
						[user],
						expedition,
						relatedUser
					);
				});
			}
			
			if(user.id == relatedUser.id) {
				return transaction.run(`MATCH (e:Expedition {id: $expeditionId}), (u:User {id: $userId})
				WITH u, e
				OPTIONAL MATCH (e)-[pje:POSSIBLY_JOINS_EXPEDITION]->(u)
				OPTIONAL MATCH (e)-[pjeAll:POSSIBLY_JOINS_EXPEDITION]-(u)
				OPTIONAL MATCH (e)<-[je:JOINS_EXPEDITION]-(u)
				OPTIONAL MATCH (e)<-[:BELONGS_TO_NODE]-(c:Comment)<-[:OWNS_COMMENT]-(u)
				DETACH DELETE c, pjeAll, pje, je
				WITH count(pje) > 0 as invited, count(je) > 0 as joined
				RETURN {invited: invited, joined: joined} as deleted`, {
					expeditionId: expedition.id,
					userId: user.id
				}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'deleted').shift()).then((deleted: any) => {
					if(deleted.joined || deleted.invited) return AccountController.NotificationController.set(
						transaction,
						deleted.joined ? NotificationType.LEFT_EXPEDITION : NotificationType.REJECTED_INVITATION_FOR_EXPEDITION,
						[owner],
						expedition,
						user
					);
				});
			}
		});
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
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'as').shift());
	}

    export function removeExpeditions(transaction: Transaction, rudel: Rudel, user: User = null): Promise<void> {
        let query = user ?
            `MATCH(:Rudel {id: $rudelId})<-[:BELONGS_TO_RUDEL]-(e:Expedition)<-[:OWNS_EXPEDITION]-(:User {id: $userId}) CALL apoc.index.removeNodeByName('Expedition', e) DETACH DELETE e` :
            `MATCH(:Rudel {id: $rudelId})<-[:BELONGS_TO_RUDEL]-(e:Expedition) CALL apoc.index.removeNodeByName('Expedition', e) DETACH DELETE e`;

        let params: any = {
            rudelId: rudel.id
        };
        if(user) params.userId = user.id;

        return transaction.run(query, params).then(() => {
            return CommentController.removeDetachedComments(transaction);
        }).then(() => {
            return AccountController.NotificationController.removeDetachedNotifications(transaction);
        });
    }
	
	export function removeExpedition(transaction: Transaction, expedition: Expedition): Promise<void> {
		return transaction.run(`MATCH(e:Expedition {id: $expeditionId}) CALL apoc.index.removeNodeByName('Expedition', e) DETACH DELETE e`, {
            expeditionId: expedition.id
        }).then(() => {
            return CommentController.removeDetachedComments(transaction);
        }).then(() => {
		    return AccountController.NotificationController.removeDetachedNotifications(transaction);
        });
	}
	
	export function create(transaction: Transaction, recipe: ExpeditionRecipe): Promise<Expedition> {
		let expedition: Expedition = {
			id: shortid.generate(),
			title: recipe.title,
			description: recipe.description,
			needsApproval: recipe.needsApproval,
			date: UtilController.timestamp(recipe.date),
			icon: recipe.icon,
			location: recipe.location,
			fuzzyTime: recipe.fuzzyTime
		};
		return this.save(transaction, expedition).then(() => expedition);
	}
	
	export function save(transaction: Transaction, expedition: Expedition): Promise<void> {
		// Set timestamps.
		let now = Math.trunc(Date.now() / 1000);
		if (!expedition.createdAt) expedition.createdAt = now;
		expedition.updatedAt = now;
		
		// Save.
		let promises: Promise<any>[] = [
			transaction.run(`MERGE (e:Expedition {id: $expedition.id}) ON CREATE SET e = $flattenExpedition ON MATCH SET e = $flattenExpedition WITH e OPTIONAL MATCH (e)<-[r:RTREE_REFERENCE]-() DETACH DELETE r WITH e CALL spatial.addNode("Expedition", e) yield node RETURN COUNT(*)`, {
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
		return transaction.run("MATCH(:Expedition {id : $expeditionId })<-[:OWNS_EXPEDITION]-(u:User) RETURN COALESCE(properties(u), []) as u LIMIT 1", {
			expeditionId: expedition.id
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'u').shift());
	}

	export function getAttendeeStatuses(transaction: Transaction, expedition: Expedition, skip = 0, limit = 25): Promise<{
		status: AttendeeStatus,
		user: User
	}[]> {
		return transaction.run(`MATCH(e:Expedition {id : $expeditionId})-[pje]-(u:User) WHERE (e)-[:POSSIBLY_JOINS_EXPEDITION]-(u) OR (e)-[:JOINS_EXPEDITION]-(u) WITH e, u, pje.createdAt as date OPTIONAL MATCH(u)<-[invitee:POSSIBLY_JOINS_EXPEDITION]-(e) OPTIONAL MATCH(u)-[attendee:JOINS_EXPEDITION]->(e) OPTIONAL MATCH(u)-[applicant:POSSIBLY_JOINS_EXPEDITION]->(e) WITH u, invitee, attendee, applicant, date ORDER BY date DESC RETURN {user: properties(u), status: {isInvitee: COUNT(invitee) > 0, isApplicant: COUNT(applicant) > 0, isAttendee: COUNT(attendee) > 0}} as u SKIP $skip LIMIT $limit`, {
			expeditionId: expedition.id,
			skip: skip,
			limit: limit
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'u'));
	}

	export function getAllAttendees(transaction: Transaction, expedition: Expedition, exclude: User[]): Promise<User[]> {
		return transaction.run(`MATCH(:Expedition {id : $expeditionId})<-[:JOINS_EXPEDITION]-(u:User) WHERE NOT u.id IN $excludeIds RETURN properties(u) as u`, {
			expeditionId: expedition.id,
			excludeIds: exclude.map(user => user.id)
		}).then((result: StatementResult) =>  DatabaseManager.neo4jFunctions.unflatten(result.records, 'u'));
	}
	
	export function inviteLike(transaction: Transaction, expedition: Expedition, query: string, relatedUser: User, skip = 0, limit = 25): Promise<{
		status: AttendeeStatus,
		user: User
	}[]> {
		return transaction.run("MATCH(e:Expedition {id : $expeditionId}), (relatedUser:User {id: $relatedUserId}) WITH relatedUser, e CALL apoc.index.search('User', $query) YIELD node WITH node as u, e, relatedUser WHERE (u)-[:LIKES_USER]->(relatedUser) OPTIONAL MATCH(u)<-[invitee:POSSIBLY_JOINS_EXPEDITION]-(e) OPTIONAL MATCH(u)-[attendee:JOINS_EXPEDITION]->(e) OPTIONAL MATCH(u)-[applicant:POSSIBLY_JOINS_EXPEDITION]->(e) RETURN {user: properties(u), status: {isInvitee: COUNT(invitee) > 0, isApplicant: COUNT(applicant) > 0, isAttendee: COUNT(attendee) > 0}} as u SKIP $skip LIMIT $limit", {
			expeditionId: expedition.id,
			query: `${DatabaseManager.neo4jFunctions.escapeLucene(query)}~`,
			relatedUserId: relatedUser.id,
			skip: skip,
			limit: limit
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'u'));
	}
	
	export function setRudel(transaction: Transaction, expedition: Expedition, rudel: Rudel): Promise<void> {
		return transaction.run("MATCH(e:Expedition {id : $expeditionId}), (nr:Rudel {id: $rudelId}) OPTIONAL MATCH (e)-[obtr:BELONGS_TO_RUDEL]->(:Rudel) DETACH DELETE obtr WITH e, nr CREATE (e)-[nbtr:BELONGS_TO_RUDEL]->(nr)", {
			expeditionId: expedition.id,
			rudelId: rudel.id
		}).then(() => {});
	}
	
	export function getRudel(transaction: Transaction, expedition: Expedition): Promise<Rudel> {
		return transaction.run("MATCH(:Expedition {id : $expeditionId })-[:BELONGS_TO_RUDEL]->(r:Rudel) RETURN COALESCE(properties(r), []) as r LIMIT 1", {
			expeditionId: expedition.id
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'r').shift());
	}
	
	export function isAttendee(transaction: Transaction, expedition: Expedition, user: User): Promise<boolean> {
		return transaction.run("MATCH(e:Expedition {id : $expeditionId }), (u:User {id: $userId}) OPTIONAL MATCH (e)<-[je:JOINS_EXPEDITION]-(u) RETURN COUNT(je) > 0 as je", {
			expeditionId: expedition.id,
			userId: user.id
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'je').shift());
	}
	
	export function nearby(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Expedition[]> {
		return transaction.run(`CALL spatial.closest("Expedition", $location, ${SEARCH_RADIUS_METERS / 1000}) YIELD node as e RETURN properties(e) as e SKIP $skip LIMIT $limit`, {
			location: {
				latitude: user.location.latitude,
				longitude: user.location.longitude
			},
			limit: limit,
			skip: skip
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'e'));
	}

    export function suggested(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Expedition[]> {
        return transaction.run(`CALL spatial.closest("Expedition", $user.location, ${SEARCH_RADIUS_METERS / 1000}) YIELD node as e WITH e WHERE (e)-[:BELONGS_TO_RUDEL]->(:Rudel)<-[:LIKES_RUDEL]-(:User {id: $user.id}) AND e.date > $now AND e.date < $now + 604800 WITH e ORDER BY e.date SKIP $skip LIMIT $limit RETURN properties(e) as e`, {
            user: user,
            now: Math.trunc(Date.now() / 1000),
            limit: limit,
            skip: skip
        }).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'e'));
    }

	export function popular(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Expedition[]> {
		return transaction.run(`MATCH (u:User {id: $user.id}) CALL spatial.closest("Expedition", $user.location, ${SEARCH_RADIUS_METERS / 1000}) YIELD node as e WITH e WHERE e.date > $now AND NOT (e)-[:BELONGS_TO_RUDEL]->(:Rudel)<-[:DISLIKES_RUDEL]-(u) WITH e, size((e)<-[:JOINS_EXPEDITION]-()) as popularity ORDER BY popularity DESC RETURN properties(e) as e SKIP $skip LIMIT $limit`, {
			user: user,
			now: Math.trunc(Date.now() / 1000),
			limit: limit,
			skip: skip
		}).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'e'));
	}

    export function recent(transaction: Transaction, user: User, skip = 0, limit = 25): Promise<Expedition[]> {
        return transaction.run(`MATCH (u:User {id: $user.id}) CALL spatial.closest("Expedition", $user.location, ${SEARCH_RADIUS_METERS / 1000}) YIELD node as e WITH e, u WHERE e.date > $now AND NOT (e)-[:BELONGS_TO_RUDEL]->(:Rudel)<-[:DISLIKES_RUDEL]-(u) WITH e ORDER BY e.createdAt DESC SKIP $skip LIMIT $limit RETURN properties(e) as e`, {
            user: user,
            now: Math.trunc(Date.now() / 1000),
            limit: limit,
            skip: skip
        }).then((result: StatementResult) => DatabaseManager.neo4jFunctions.unflatten(result.records, 'e'));
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
				if(moment().diff(request.payload.expedition.date) > 0) return Promise.reject(Boom.badRequest('Date is in the past!'));
				
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
				return ExpeditionController.getAttendeeStatuses(transaction, expedition, request.query.offset, request.query.limit);
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
					if (owner.id == request.auth.credentials.id || values[1].id == request.auth.credentials.id) return ExpeditionController.rejectUser(transaction, values[0], values[1], request.auth.credentials).then(() => {
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
						}) as Promise<any>;
					});
					return Promise.reject(Boom.forbidden('You do not have enough privileges to perform this operation.'));
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/search/{query}
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
			let promise: Promise<any[]> = ExpeditionController.findByFulltext(request.params.query, request.query.offset, request.query.limit).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/upcoming
		 * @param request Request-Object
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function upcomingByUser(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.findUpcomingByUser(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/done
		 * @param request Request-Object
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function doneByUser(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.findDoneByUser(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/upcoming/{rudel}
		 * @param request Request-Object
		 * @param request.params.rudel rudel
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function upcomingByRudel(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.rudel).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.badRequest('Rudel does not exist!'));
				return ExpeditionController.findUpcomingByRudel(transaction, rudel, request.auth.credentials, request.query.offset, request.query.limit).then((expeditions: Expedition[]) => {
					return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/done/{rudel}
		 * @param request Request-Object
		 * @param request.params.rudel rudel
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function doneByRudel(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = RudelController.get(transaction, request.params.rudel).then((rudel: Rudel) => {
				if (!rudel) return Promise.reject(Boom.badRequest('Rudel does not exist!'));
				return ExpeditionController.findDoneByRudel(transaction, rudel, request.auth.credentials, request.query.offset, request.query.limit).then((expeditions: Expedition[]) => {
					return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
				});
			});
			
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
			let promise: Promise<any> = ExpeditionController.nearby(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/recent
		 * @param request Request-Object
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function recent(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.recent(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/popular
		 * @param request Request-Object
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function popular(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.popular(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/expeditions/suggested
		 * @param request Request-Object
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function suggested(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.suggested(transaction, request.auth.credentials, request.query.offset, request.query.limit).then((expeditions: Expedition[]) => {
				return ExpeditionController.getPublicExpedition(transaction, expeditions, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
	}
}
