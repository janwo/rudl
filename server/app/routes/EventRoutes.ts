import {UserRoles} from "../models/users/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");
import {ActivityController} from "../controllers/ActivityController";
import {TranslationsValidation} from "../models/Translations";

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/events/like/{query}/{offset?}',
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
		path: '/api/events/=/{key}',
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
		path: '/api/events/=/{key}/lists/{filter}/{interval?}',
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
		path: '/api/events/set-rating',
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
		path: '/api/events/create',
		method: 'POST',
		handler: ActivityController.RouteHandlers.createActivity,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					translations: TranslationsValidation
				}
			}
		}
	},
];
