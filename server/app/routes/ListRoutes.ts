import {UserRoles, UserValidation} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {ListController} from "../controllers/ListController";
import {TranslationsValidation} from "../models/Translations";
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");
import Joi = require('joi');
import {ListValidation} from "../models/list/List";

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
					query: Joi.string().min(3),
					offset: Joi.number().min(0).default(0)
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
		path: '/api/lists/=/{key}/activities/{filter}/{interval?}',
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
					key: Joi.string(),
					interval: Joi.array().min(1).max(2).items(Joi.number().min(0)).default([0]),
					filter: Joi.string().allow('all', 'owned', 'followed')
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
				payload: ListValidation
			}
		}
	},
	{
		path: '/api/lists/follow/{list}',
		method: 'POST',
		handler: ListController.RouteHandlers.addFollowee,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					list: Joi.string()
				}
			}
		}
	},
	{
		path: '/api/lists/unfollow/{list}',
		method: 'POST',
		handler: ListController.RouteHandlers.deleteFollowee,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					list: Joi.string()
				}
			}
		}
	},
	{
		path: '/api/lists/=/{key}/followers',
		method: 'GET',
		handler: ListController.RouteHandlers.getFollowers,
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
	}
];
