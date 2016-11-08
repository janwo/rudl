import {UserRoles} from "../models/users/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {UserController} from "../controllers/UserController";
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");
import {ActivityController} from "../controllers/ActivityController";

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/activities/=/{key}',
		method: 'GET',
		handler: ActivityController.RouteHandlers.getActivity,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/activities/in/{list}',
		method: 'GET',
		handler: ActivityController.RouteHandlers.getActivitiesIn,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/activities/like/{query}',
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
					query: Joi.string().min(3)
				}
			}
		}
	},
];
