import {UserRoles, UserValidation} from "../models/users/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");
import Joi = require('joi');
import {ListController} from "../controllers/ListController";
import {TranslationsValidation} from "../models/Translations";

const UsernameValidation = Joi.alternatives().try(UserValidation.username, Joi.string().regex(/^me$/));

export const RoutesConfig: RoutesConfiguration = [
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
	{
		path: '/api/lists/=/{key}',
		method: 'GET',
		handler: ListController.RouteHandlers.getList,
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
		path: '/api/lists/=/{key}/activities',
		method: 'GET',
		handler: ListController.RouteHandlers.getActivities,
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
		path: '/api/lists/add-activity',
		method: 'POST',
		handler: ListController.RouteHandlers.addActivity,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					list: Joi.string(),
					activity: Joi.string()
				}
			}
		}
	},
	{
		path: '/api/lists/delete-activity',
		method: 'POST',
		handler: ListController.RouteHandlers.deleteActivity,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					list: Joi.string(),
					activity: Joi.string()
				}
			}
		}
	},
	{
		path: '/api/lists/create',
		method: 'POST',
		handler: ListController.RouteHandlers.createList,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					translations: TranslationsValidation,
					activities: Joi.array().items(Joi.string()).optional()
				}
			}
		}
	},
];
