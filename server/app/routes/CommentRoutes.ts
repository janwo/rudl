import {UserRoles} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import * as Joi from 'joi';
import {CommentController} from '../controllers/CommentController';
import {CommentValidation} from '../models/comment/Comment';

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/comments/expeditions/{key}/create',
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
					key: Joi.string()
				},
				payload: CommentValidation
			}
		}
	},
	{
		path: '/api/comments/=/${key}/update',
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
					key: Joi.string()
				},
				payload: CommentValidation
			}
		}
	},
	{
		path: '/api/comments/=/{key}',
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
					key: Joi.string()
				}
			}
		}
	},
	{
		path: '/api/comments/expeditions/{key}/{offset}/{limit}',
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
					offset: Joi.number(),
					limit: Joi.number()
				}
			}
		}
	}
];
