import {UserRoles} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import * as Joi from 'joi';
import {CommentController} from '../controllers/CommentController';
import {CommentValidation} from '../models/comment/Comment';

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/expeditions/=/{id}/create-comment',
		method: 'POST',
		handler: CommentController.RouteHandlers.createForExpedition,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string()
				},
				payload: CommentValidation
			}
		}
	},
	{
		path: '/api/expeditions/=/{id}/comments',
		method: 'GET',
		handler: CommentController.RouteHandlers.getForExpedition,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string()
				},
				query: {
					offset: Joi.number().min(0).default(0),
					limit: Joi.number().positive().max(100).default(25)
				}
			}
		}
	},
	{
		path: '/api/comments/=/${id}/update',
		method: 'POST',
		handler: CommentController.RouteHandlers.update,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string()
				},
				payload: CommentValidation
			}
		}
	},
	{
		path: '/api/comments/=/{id}',
		method: 'DELETE',
		handler: CommentController.RouteHandlers.remove,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string()
				}
			}
		}
	}
];
