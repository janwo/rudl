import * as Boom from 'boom';
import * as dot from 'dot-object';
import {DatabaseManager, TransactionSession} from '../Database';
import {User} from '../models/user/User';
import {UserController} from './UserController';
import {Comment} from '../models/comment/Comment';
import {Node} from '../models/Node';
import * as shortid from 'shortid';
import {ExpeditionController} from './ExpeditionController';
import {CommentRecipe} from '../../../client/app/models/comment';
import {Expedition} from '../models/expedition/Expedition';
import Transaction from 'neo4j-driver/lib/v1/transaction';
import {AccountController} from "./AccountController";
import {UtilController} from './UtilController';

export module CommentController {
	
	export function create(transaction: Transaction, recipe: CommentRecipe): Promise<Comment> {
		let comment: Comment = {
			id: shortid.generate(),
			message: recipe.message,
			pinned: recipe.pinned
		};
		return this.save(transaction, comment).then(() => comment);
	}
	
	export function save(transaction: Transaction, comment: Comment): Promise<void> {
		// Set timestamps.
		let now = Date.now() / 1000;
		if (!comment.createdAt) comment.createdAt = now;
		comment.updatedAt = now;
		
		// Save.
		return transaction.run("MERGE (c:Comment {id: $comment.id}) ON CREATE SET c = $flattenComment ON MATCH SET c = $flattenComment", {
			comment: comment,
			flattenComment: DatabaseManager.neo4jFunctions.flatten(comment)
		}).then(() => {});
	}
	
	export function assign<T extends Node>(transaction: Transaction, comment: Comment, user: User, node: T): Promise<void> {
		return transaction.run(`MATCH(c:Comment {id: $commentId}), (u:User {id: $userId}), (n {id: $nodeId}) OPTIONAL MATCH (c)-[r]-() DETACH DELETE r WITH c, u, n CREATE UNIQUE (u)-[:OWNS_COMMENT]->(c)-[:BELONGS_TO_NODE]->(n)`, {
			nodeId: node.id,
			userId: user.id,
			commentId: comment.id
		}).then(() => {});
	}
	
	export function removeById(transaction: Transaction, comment: Comment): Promise<any> {
		return transaction.run(`MATCH(c:Comment {id: $commentId}) DETACH DELETE c`, {
			commentId: comment.id
		}).then(() => AccountController.NotificationController.removeDetachedNotifications(transaction));
	}

	export function removeDetachedComments(transaction: Transaction): Promise<void> {
		return transaction.run(`MATCH (c:Comment) WHERE NOT ()<-[:BELONGS_TO_NODE]-(c) DETACH DELETE c`).then(() => {});
	}

	export function get(transaction: Transaction, commentId: string): Promise<any> {
		return transaction.run(`MATCH(c:Comment {id: $commentId}) RETURN COALESCE(properties(c), []) as c LIMIT 1`, {
			commentId: commentId
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'c').shift());
	}
	
	export function getPublicComment(transaction: Transaction, comment: Comment | Comment[], relatedUser: User): Promise<any | any[]> {
		let createPublicComment = (comment: Comment): Promise<any> => {
			let commentOwnerPromise = CommentController.getOwner(transaction, comment);
			let publicCommentOwnerPromise = commentOwnerPromise.then((owner: User) => {
				return UserController.getPublicUser(transaction, owner, relatedUser, true);
			});
			return Promise.all([
				commentOwnerPromise,
				publicCommentOwnerPromise
			]).then((values: [User, any]) => {
				// Build profile.
				return Promise.resolve(dot.transform({
					'comment.id': 'id',
					'comment.message': 'message',
					'comment.pinned': 'pinned',
					'updatedAt': 'updatedAt',
					'createdAt': 'createdAt',
					'owner': 'owner',
					'isOwner': 'relations.isOwned'
				}, {
					comment: comment,
					createdAt: UtilController.isoDate(comment.createdAt),
					updatedAt: UtilController.isoDate(comment.updatedAt),
					owner: values[1],
					isOwner: values[0].id == relatedUser.id
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
	
	export function getOwner(transaction: Transaction, comment: Comment): Promise<User> {
		return transaction.run<User, any>(`MATCH(c:Comment {id: $commentId})<-[:OWNS_COMMENT]-(u:User) RETURN COALESCE(properties(u), []) as u LIMIT 1`, {
			commentId: comment.id
		}).then(results => DatabaseManager.neo4jFunctions.unflatten(results.records, 'u').shift());
	}
	
	export function ofNode<T extends Node>(transaction: Transaction, node: T, skip = 0, limit = 25): Promise<Comment[]> {
		return transaction.run<Comment, any>(`MATCH(n {id: $nodeId})<-[:BELONGS_TO_NODE]-(c:Comment) WITH properties(c) as c RETURN c ORDER BY c.pinned DESC, c.createdAt DESC SKIP $skip LIMIT $limit`, {
			nodeId: node.id,
			limit: limit,
			skip: skip
		}).then(results => {
			return DatabaseManager.neo4jFunctions.unflatten(results.records, 'c');
		});
	}
	
	export namespace RouteHandlers {
		
		/**
		 * Handles [POST] /api/expeditions/{id}/create-comment
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.payload.message message
		 * @param request.payload.pin pin
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function createForExpedition(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.get(transaction, request.params.id).then((expedition: Expedition) => {
				if (!expedition) return Promise.reject(Boom.notFound('Expedition not found.'));
				
				return ExpeditionController.isAttendee(transaction, expedition, request.auth.credentials).then((isAttendee: boolean) => {
					if (!isAttendee) return Promise.reject(Boom.forbidden('You do not have enough privileges to perform this operation.'));
				}).then(() => expedition);
			}).then((expedition: Expedition) => {
				return CommentController.create(transaction, {
					pinned: request.payload.pinned,
					message: request.payload.message
				}).then((comment: Comment) => {
					return CommentController.assign(transaction, comment, request.auth.credentials, expedition).then(() => {
						return CommentController.getPublicComment(transaction, comment, request.auth.credentials);
					});
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [POST] /api/comments/=/{id}/update
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.payload.recipe.message message
		 * @param request.payload.recipe.pinned pinned
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function update(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = CommentController.get(transaction, request.params.id).then((comment: Comment) => {
				if (!comment) return Promise.reject(Boom.badRequest('Comment does not exist!'));
				
				return CommentController.getOwner(transaction, comment).then(owner => {
					if (owner.id != request.auth.credentials.id) return Promise.reject(Boom.forbidden('You do not have enough privileges to update comment.'));
					
					// Update comment.
					if (request.payload.pinned) comment.pinned = request.payload.pinned;
					if (request.payload.message) comment.message = request.payload.message;
					return CommentController.save(transaction, comment);
				}).then(() => CommentController.getPublicComment(transaction, comment, request.auth.credentials));
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [DELETE] /api/comments/=/{id}
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function remove(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = CommentController.get(transaction, request.params.id).then((comment: Comment) => {
				if (!comment) return Promise.reject(Boom.notFound('Comment not found.'));
				return CommentController.getOwner(transaction, comment).then((owner: User) => {
					if (owner.id != request.auth.credentials.id) return Promise.reject(Boom.forbidden('You do not have enough privileges to update comment.'));
					return CommentController.removeById(transaction, comment).then(() => {});
				});
			});
			
			reply.api(promise, transactionSession);
		}
		
		/**
		 * Handles [GET] /api/comments/expeditions/{id}
		 * @param request Request-Object
		 * @param request.params.id id
		 * @param request.query.offset offset (optional, default=0)
		 * @param request.query.limit limit (optional, default=25)
		 * @param request.auth.credentials
		 * @param reply Reply-Object
		 */
		export function getForExpedition(request: any, reply: any): void {
			// Create promise.
			let transactionSession = new TransactionSession();
			let transaction = transactionSession.beginTransaction();
			let promise: Promise<any> = ExpeditionController.get(transaction, request.params.id).then((expedition: Expedition) => {
				if (!expedition) return Promise.reject(Boom.notFound('Expedition not found.'));
				
				return ExpeditionController.isAttendee(transaction, expedition, request.auth.credentials).then((isAttendee: boolean) => {
					if (!isAttendee) return Promise.reject(Boom.forbidden('You do not have enough privileges to perform this operation.'));
				}).then(() => expedition);
			}).then((expedition: Expedition) => {
				return CommentController.ofNode(transaction, expedition, request.query.offset, request.query.limit);
			}).then((comments: Comment[]) => {
				return CommentController.getPublicComment(transaction, comments, request.auth.credentials);
			});
			
			reply.api(promise, transactionSession);
		}
	}
}
