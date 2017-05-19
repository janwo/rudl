import {UserRoles, UserValidation} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {UserController} from "../controllers/UserController";
import * as Joi from 'joi';

const UsernameValidation = Joi.alternatives().try(UserValidation.username, Joi.string().regex(/^me$/));

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/users/=/{username}',
		method: 'GET',
		handler: UserController.RouteHandlers.getUser,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					username: UsernameValidation
				}
			}
		}
	},
	{
		path: '/api/users/like/{query}/{offset?}',
		method: 'GET',
		handler: UserController.RouteHandlers.getUsersLike,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					query: Joi.string().min(3),
					offset: Joi.number().min(0).default(0)
				}
			}
		}
	},
	{
		path: '/api/users/=/{username}/followers/{offset?}',
		method: 'GET',
		handler: UserController.RouteHandlers.followers,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					username: UsernameValidation,
					offset: Joi.number().min(0).default(0)
				}
			}
		}
	},
	{
		path: '/api/users/=/{username}/followees/{offset?}',
		method: 'GET',
		handler: UserController.RouteHandlers.followees,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					username: UsernameValidation,
					offset: Joi.number().min(0).default(0)
				}
			}
		}
	},
	{
		path: '/api/users/follow/{followee}',
		method: 'POST',
		handler: UserController.RouteHandlers.follow,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					followee: UserValidation.username
				}
			}
		}
	},
	{
		path: '/api/users/unfollow/{followee}',
		method: 'POST',
		handler: UserController.RouteHandlers.unfollow,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					followee: UserValidation.username
				}
			}
		}
	},
];
