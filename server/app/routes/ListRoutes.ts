import {UserRoles, UserValidation} from "../models/users/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");
import Joi = require('joi');
import {ListController} from "../controllers/ListController";

const UsernameValidation = Joi.alternatives().try(UserValidation.username, Joi.string().regex(/^me$/));

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/lists/=/{key}',
		method: 'GET',
		handler: ListController.RouteHandlers.getList,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/lists/by/{username}',
		method: 'GET',
		handler: ListController.RouteHandlers.getListsBy,
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
		path: '/api/lists/like/{query}',
		method: 'GET',
		handler: ListController.RouteHandlers.getListsLike,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					query: Joi.string().min(3)
				}
			}
		}
	},
];
