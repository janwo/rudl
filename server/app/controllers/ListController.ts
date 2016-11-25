import Nodemailer = require("nodemailer");
import Boom = require("boom");
import Uuid = require("node-uuid");
import dot = require("dot-object");
import fs = require('fs');
import path = require('path');
import {User} from "../models/users/User";
import {DatabaseManager, arangoCollections} from "../Database";
import randomstring = require("randomstring");
import jwt = require("jsonwebtoken");
import {Cursor} from "arangojs";
import _ = require("lodash");
import {List} from "../models/lists/List";
import {UserController} from "./UserController";

export module ListController {
	
	export function getPublicList(list: List | List[], relatedUser: User) {
		let createPublicList = list => {
			return UserController.getPublicUser(list.owner, relatedUser).then(user => {
				// Set owner.
				list.owner = user;
				
				// Set list statistics.
				return getListStatistics(list, relatedUser).then((statistics : ListStatistics) => {
					// Add default links.
					let links = {};
					
					// Build profile.
					return dot.transform({
						'list._key': 'id',
						'list.translations': 'translations',
						'list.owner': 'owner',
						'relations': 'relations',
						'followers': 'followers',
						'links': 'links'
					}, {
						list: list,
						relations: {
							owning: statistics.owning,
							following: statistics.following
						},
						links: links,
						followers: statistics.followers
					});
				});
			});
		};
		
		let now = Date.now();
		let transformed = list instanceof Array ? Promise.all(list.map(createPublicList)) : createPublicList(list);
		return transformed.then((result : any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' lists' : '1 list'} took ${Date.now() - now} millis`);
			return result;
		});
	}
	
	export interface ListStatistics {
		owning: boolean;
		following: boolean;
		followers: number;
	}
	
	export function getListStatistics(list: List, user: User) : Promise<ListStatistics> {
		let aqlQuery = `LET followers = (FOR follower IN INBOUND @listId @@edgesFollows RETURN follower) LET follows = (FOR list IN OUTBOUND @userId @@edgesFollows FILTER list._id == @listId RETURN list) let owns = (FOR list IN OUTBOUND @userId @@edgesOwns FILTER list._id == @listId RETURN list) RETURN {owning: LENGTH(owns) > 0, following: LENGTH(follows) > 0, followers: LENGTH(followers)}`;
		let aqlParams = {
			'@edgesFollows': arangoCollections.userFollowsList,
			'@edgesOwns': arangoCollections.userOwnsList,
			listId: list._id,
			userId: user._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next());
	}
	
	export function getListFollowers(list: List, countOnly: boolean = false) : Promise<User[] | number> {
		let aqlQuery = `FOR user IN INBOUND @listId @@edgesFollows ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN user'}`;
		let aqlParams = {
			'@edgesFollows': arangoCollections.userFollowsList,
			listId: list._id
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all());
	}
	
	export function getListsBy(user: User, countOnly: boolean = false) : Promise<List[] | number>{
		let aqlQuery = countOnly ?
			`FOR list IN OUTBOUND @from @@edgesFollows COLLECT WITH COUNT INTO length RETURN length` :
			`FOR list IN OUTBOUND @from @@edgesFollows FOR user IN INBOUND list @@edgesOwns RETURN MERGE({owner: user}, list)`;
		let aqlParams = {
			'@edgesFollows': arangoCollections.userFollowsList,
			from: user
		};
		if(!countOnly) aqlParams['@edgesOwns'] = arangoCollections.userOwnsList;
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all());
	}
	
	export function getList(key: string) : Promise<List>{
		let aqlQuery = `FOR list IN @@collection FILTER list._key == @key FOR user IN INBOUND list @@edgesOwns RETURN MERGE({owner: user}, list)`;
		let aqlParams = {
			'@collection': arangoCollections.lists,
			'@edgesOwns': arangoCollections.userOwnsList,
			key: key
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next());
	}
	
	export function getListsLike(query: string, countOnly: boolean = false) : Promise<List[] | number>{
		let aqlQuery = `FOR list IN FULLTEXT(@@collection, "name", @query) ${countOnly ? 'COLLECT WITH COUNT INTO length RETURN length' : 'RETURN list'}`;
		let aqlParams = {
			'@collection': arangoCollections.lists,
			query: query.split(' ').map(word => '|' + word).join()
		};
		return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => countOnly ? cursor.next() : cursor.all());
	}
	
	export namespace RouteHandlers {
		
		import gatewayTimeout = Boom.gatewayTimeout;
		/**
		 * Handles [GET] /api/lists/=/{key}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getList(request: any, reply: any): void {
			let paramKey = encodeURIComponent(request.params.key);
			
			// Create promise.
			let promise: Promise<List> = ListController.getList(paramKey).then(list => getPublicList(list, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/lists/by/{username}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getListsBy(request: any, reply: any): void {
			let paramUsername = encodeURIComponent(request.params.username);
			
			// Create promise.
			let promise : Promise<User> = Promise.resolve(paramUsername != 'me' ? UserController.findByUsername(paramUsername) : request.auth.credentials);
			promise = promise.then(ListController.getListsBy).then((lists: List[]) => getPublicList(lists, request.auth.credentials));
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/lists/like/{query}
		 * @param request Request-Object
		 * @param request.params.query query
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getListsLike(request: any, reply: any): void {
			let paramQuery = encodeURIComponent(request.params.query);
			
			// Create promise.
			let promise : Promise<List[]> = ListController.getListsLike(paramQuery).then((lists: List[]) => getPublicList(lists, request.auth.credentials));
			
			reply.api(promise);
		}
	}
}
