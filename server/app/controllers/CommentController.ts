import * as Boom from "boom";
import * as dot from "dot-object";
import {DatabaseManager} from "../Database";
import {Cursor} from "arangojs";
import {User} from "../models/user/User";
import {UserController} from "./UserController";
import {Comment} from "../models/comment/Comment";
import {Document} from "../models/Document";
import {List} from "../models/list/List";
import {ExpeditionController} from "./ExpeditionController";
import {CommentRecipe} from '../../../client/app/models/comment';
import {Expedition} from '../models/expedition/Expedition';

export module CommentController {
	
	export function create(document: Document, user: User, recipe: CommentRecipe) : Promise<Comment>{
		let comment: Comment = {
			_from: user._id,
			_to: document._id,
			message: recipe.message,
			pinned: recipe.pin,
			createdAt: null,
			updatedAt: null
		};
		return Promise.resolve(comment);
	}
	
	export function save(comment: Comment): Promise<Comment> {
		// Trim message.
		comment.message = comment.message.trim();
		
		// Save.
		return DatabaseManager.arangoFunctions.updateOrCreate(comment, DatabaseManager.arangoCollections.userComment.name);
	}
	
	export function remove(comment: Comment): Promise<any> {
		let graph = DatabaseManager.arangoClient.graph(DatabaseManager.arangoGraphs.mainGraph.name);
		return graph.vertexCollection(DatabaseManager.arangoCollections.userComment.name).remove(comment._id);
	}
	
	export function getPublicComment(comment: Comment | Comment[], relatedUser: User) : Promise<any> {
		let createPublicComment = (comment: Comment) : Promise<any> => {
			let commentOwnerPromise = CommentController.getOwner(comment);
			let publicCommentOwnerPromise = commentOwnerPromise.then((owner: User) => {
				return UserController.getPublicUser(owner, relatedUser);
			});
			return Promise.all([
				commentOwnerPromise,
				publicCommentOwnerPromise
			]).then((values: [User, any]) => {
				// Build profile.
				return Promise.resolve(dot.transform({
					'comment._key': 'id',
					'comment.message': 'message',
					'comment.pinned': 'pinned',
					'owner': 'owner',
					'isOwner': 'relations.isOwned'
				}, {
					comment: comment,
					owner: values[1],
					isOwner: values[0]._key == relatedUser._key
				}));
			});
		};
		
		let now = Date.now();
		let transformed = comment instanceof Array ? Promise.all(comment.map(createPublicComment)) : createPublicComment(comment);
		return transformed.then((result: any | Array<any>) => {
			console.log(`Building profile of ${result instanceof Array ? result.length + ' comments' : '1 comment'} took ${Date.now() - now} millis`);
			return result;
		});
	}
	
	export function getOwner(comment: Comment): Promise<User> {
		return DatabaseManager.arangoClient.collection(DatabaseManager.arangoCollections.users.name).document(comment._from).then((cursor: Cursor) => cursor.next()) as any as Promise<User>;
	}
	
	export function get(document: Document): Promise<Comment[]> {
		return DatabaseManager.arangoFunctions.inbounds(document._id, DatabaseManager.arangoCollections.userComment.name).then((cursor: Cursor) => cursor.all()) as Promise<Comment[]>;
	}
	
	export function findByKey(key: string | string[]): Promise<Comment | Comment[]> {
		let collection = DatabaseManager.arangoClient.edgeCollection(DatabaseManager.arangoCollections.userComment.name);
		return key instanceof Array ? collection.lookupByKeys(key) as Promise<Comment[]> : collection.byExample({
			_key: key
		}, {
			limit: 1
		}).then(cursor => cursor.next()) as any as Promise<Comment | Comment[]>;
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [POST] /api/expeditions/{key}/create-comment
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.payload.message message
		 * @param request.payload.pin pin
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function createForExpedition(request: any, reply: any): void {
			// Create promise.
			let promise: Promise<any> = ExpeditionController.findByKey(request.params.key).then((expedition: Expedition) => {
				if(!expedition) return Promise.reject<Comment>(Boom.badRequest('Expedition does not exist!'));
				//TODO ONLY IF ACCEPTED
				return CommentController.create(expedition, request.auth.credentials, {
					pin: request.payload.pin,
					message: request.payload.message
				}).then((comment: Comment) => CommentController.save(comment)).then((comment: Comment) => {
					return CommentController.getPublicComment(comment, request.auth.credentials);
				});
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [POST] /api/comments/=/{key}/update
		 * @param request Request-Object
		 * @param request.params.key comment
		 * @param request.payload.recipe.message message
		 * @param request.payload.recipe.pinned pinned
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function update(request: any, reply: any): void {
			// Create promise.
			let promise: Promise<Comment> = CommentController.findByKey(request.params.key).then((comment: Comment) => {
				if(!comment) return Promise.reject<Comment>(Boom.badRequest('Comment does not exist!'));
				
				return CommentController.getOwner(comment).then(owner => {
					if (owner._key != request.auth.credentials._key) return Promise.reject<Comment>(Boom.forbidden('You do not have enough privileges to update comment.'));
					
					// Update comment.
					if (request.payload.pinned) comment.pinned = request.payload.pinned;
					if (request.payload.message) comment.message = request.payload.message;
					return CommentController.save(comment);
				}).then(comment => CommentController.getPublicComment(comment, request.auth.credentials));
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [DELETE] /api/comments/=/{key}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function remove(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = CommentController.findByKey(request.params.key).then((comment: Comment) => {
				if (!comment) return Promise.reject(Boom.notFound('Comment not found.'));
				return CommentController.getOwner(comment).then((owner: User) => {
					if (owner._key != request.auth.credentials._key) return Promise.reject(Boom.forbidden('You do not have enough privileges to update comment.'));
					return CommentController.remove(comment).then(() => {});
				});
			});
			
			reply.api(promise);
		}
		
		/**
		 * Handles [GET] /api/comments/expeditions/{key}/{offset}/{limit}
		 * @param request Request-Object
		 * @param request.params.key key
		 * @param request.params.limit limit
		 * @param request.params.offset offset
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getForExpedition(request: any, reply: any): void {
			// Create promise.
			let promise : Promise<any> = ExpeditionController.findByKey(request.params.key).then((expedition: Expedition) => {
				if(!expedition) return Promise.reject<Comment[]>(Boom.badRequest('Expedition does not exist!'));
				//TODO ONLY IF ACCEPTED
				return CommentController.get(expedition);
			}).then((comments: Comment[]) => {
				return comments.slice(request.params.interval[0], request.params.interval[1] > 0 ? request.params.interval[0] + request.params.interval[1] : comments.length);
			}).then((comments: Comment[]) => CommentController.getPublicComment(comments, request.auth.credentials));
			
			reply.api(promise);
		}
	}
}
