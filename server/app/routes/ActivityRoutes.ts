import {UserRoles} from "../models/users/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");
import {ActivityController} from "../controllers/ActivityController";

export const RoutesConfig: RoutesConfiguration = [
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
];
