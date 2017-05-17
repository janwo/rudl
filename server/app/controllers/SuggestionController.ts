import {DatabaseManager, TransactionSession} from "../Database";
import {UserController} from "./UserController";
import {AccountController} from "./AccountController";
import {User} from "../models/user/User";
import {Expedition} from '../models/expedition/Expedition';
import {Rudel} from '../models/rudel/Rudel';
import {RudelController} from './RudelController';
import Transaction from 'neo4j-driver/lib/v1/transaction';
import Result from 'neo4j-driver/lib/v1/result';

export module SuggestionController {
	
	export function getPeopleSuggestions(transaction: Transaction, user: User): Promise<User[]> {
		return transaction.run<User, any>("MATCH (u1:User)-[:FOLLOWS_RUDEL]->(mutual1:Rudel)<-[:FOLLOWS_RUDEL]-(u2:User)," +
		"(u2)-[:FOLLOWS_RUDEL]->(mutual2:Rudel)<-[:FOLLOWS_RUDEL]-(u3:User) " +
		"WHERE u1.id = $userId AND NOT (u1)-[:FOLLOWS_RUDEL]->()<-[:FOLLOWS_RUDEL]-(u3)" +
		"RETURN properties(u3) as u, count(DISTINCT u3) as frequency ORDER BY frequency DESC LIMIT 5", {
			userId: user.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'u'));
	}
	
	export function getRudelSuggestions(transaction: Transaction, user: User): Promise<Rudel[]> {
		return transaction.run<Rudel, any>("MATCH(r:Rudel) RETURN properties(r) as r LIMIT 5", {
			userId: user.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'r'));
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [GET] /api/suggestions/people
		 * @param request Request-Object
		 * @param reply Reply-Object
		 */
		export function getPeopleSuggestions(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = SuggestionController.getPeopleSuggestions(transaction, request.auth.credentials).then((users: User[]) => {
				return UserController.getPublicUser(transaction, users, request.auth.credentials);
			});
	
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/suggestions/rudel
		 * @param request Request-Object
		 * @param reply Reply-Object
		 */
		export function getRudelSuggestions(request: any, reply: any): void {
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise = SuggestionController.getRudelSuggestions(transaction, request.auth.credentials).then((rudel: Rudel[]) => {
				return RudelController.getPublicRudel(transaction, rudel, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
	}
}
