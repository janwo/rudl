import {UserRoles} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import * as Joi from 'joi';
import {CommentController} from '../controllers/CommentController';
import {CommentValidation} from '../models/comment/Comment';

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/comments/expeditions/{id}/create',
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
	},
	{
		path: '/api/comments/expeditions/{id}/{offset?}',
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
					id: Joi.string(),
					offset: Joi.number().min(0).default(0)
				}
			}
		}
	}
];
