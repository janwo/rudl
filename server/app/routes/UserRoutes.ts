import {UserRoles, UserValidation} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {UserController} from "../controllers/UserController";
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");

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
		handler: UserController.RouteHandlers.getFollowers,
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
		handler: UserController.RouteHandlers.getFollowees,
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
		handler: UserController.RouteHandlers.addFollowee,
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
		handler: UserController.RouteHandlers.deleteFollowee,
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
