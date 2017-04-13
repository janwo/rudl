import {UserRoles, UserValidation} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {ActivityController} from "../controllers/ActivityController";
import {TranslationsValidation} from "../models/Translations";
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");
import {ActivityValidation} from "../models/activity/Activity";

const UsernameValidation = Joi.alternatives().try(UserValidation.username, Joi.string().regex(/^me$/));

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/activities/by/{username}',
		method: 'GET',
		handler: ActivityController.RouteHandlers.getActivitiesBy,
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
		path: '/api/activities/like/{query}/{offset?}',
		method: 'GET',
		handler: ActivityController.RouteHandlers.getActivitiesLike,
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
		path: '/api/activities/=/{key}',
		method: 'GET',
		handler: ActivityController.RouteHandlers.getActivity,
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
		path: '/api/activities/=/{key}/lists/{filter}/{interval?}',
		method: 'GET',
		handler: ActivityController.RouteHandlers.getLists,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					key: Joi.string(),
					interval: Joi.array().min(1).max(2).items(Joi.number().min(0)).default([0]),
					filter: Joi.string().allow('all', 'owned', 'followed').default('all')
				}
			}
		}
	},
	{
		path: '/api/activities/set-rating',
		method: 'POST',
		handler: ActivityController.RouteHandlers.setRating,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					activity: Joi.string(),
					rating: Joi.number().integer().min(-1).max(1)
				}
			}
		}
	},
	{
		path: '/api/activities/create',
		method: 'POST',
		handler: ActivityController.RouteHandlers.createActivity,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: ActivityValidation
			}
		}
	}
];
