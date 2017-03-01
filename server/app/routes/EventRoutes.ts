import {UserRoles} from "../models/users/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {EventController} from "../controllers/EventController";
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/events/like/{query}/{offset?}',
		method: 'GET',
		handler: EventController.RouteHandlers.getEventsLike,
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
		handler: EventController.RouteHandlers.getEvent,
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
		path: '/api/events/create',
		method: 'POST',
		handler: EventController.RouteHandlers.createEvent,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					title: Joi.string().min(3),
					description: Joi.string().optional(),
					needsApproval: Joi.boolean().default(false),
					slots: Joi.number().min(0).default(0),
					date: Joi.date(),
					fuzzyDate: Joi.boolean().default(false),
					location: Joi.array().items(Joi.number())
				}
			}
		}
	},
];
