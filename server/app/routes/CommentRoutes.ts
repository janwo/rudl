import {UserRoles} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {Config} from "../../../run/config";
import * as Joi from 'joi';
import {CommentController} from '../controllers/CommentController';

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/comments/create',
		method: 'POST',
		handler: CommentController.RouteHandlers.uploadAvatar,
		config: {
			payload: {
				output: 'stream',
				maxBytes: Config.backend.maxUploadBytes.avatars,
				parse: true,
				allow: 'multipart/form-data'
			},
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/comments/=/${key}/update',
		method: 'POST',
		handler: CommentController.RouteHandlers.updateLocation,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					latitude: Joi.number().min(-90).max(90),
					longitude: Joi.number().min(-180).max(180)
				}
			}
		}
	},
	{
		path: '/api/comments/=/{key}',
		method: 'DELETE',
		handler: CommentController.RouteHandlers.updateBoarding,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					boarded: Joi.boolean()
				}
			}
		}
	},
	{
		path: '/api/comments/of/{collection}/{key}/{offset}/{limit}',
		method: 'GET',
		handler: CommentController.RouteHandlers.updateBoarding,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					boarded: Joi.boolean()
				}
			}
		}
	}
];
