import {UserRoles, UserValidation} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {RudelController} from "../controllers/RudelController";
import * as Joi from 'joi';
import {RudelValidation} from "../models/rudel/Rudel";

const UsernameValidation = Joi.alternatives().try(UserValidation.username, Joi.string().regex(/^me$/));

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/rudel/create',
		method: 'POST',
		handler: RudelController.RouteHandlers.create,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: RudelValidation
			}
		}
	},
	{
		path: '/api/rudel/=/{id}',
		method: 'POST',
		handler: RudelController.RouteHandlers.update,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string()
				},
				payload: {
					translations: RudelValidation.translations.optional(),
					icon: RudelValidation.icon.optional()
				}
			}
		}
	},
	{
		path: '/api/rudel/=/{id}',
		method: 'GET',
		handler: RudelController.RouteHandlers.get,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string()
				}
			}
		}
	},
	{
		path: '/api/rudel/by/{username}',
		method: 'GET',
		handler: RudelController.RouteHandlers.by,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					username: UsernameValidation
				},
				query: {
					offset: Joi.number().min(0).default(0),
					limit: Joi.number().positive().max(100).default(25)
				}
			}
		}
	},
	{
		path: '/api/rudel/like/{query}',
		method: 'GET',
		handler: RudelController.RouteHandlers.like,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					query: Joi.string().min(3)
				},
				query: {
					offset: Joi.number().min(0).default(0),
					limit: Joi.number().positive().max(100).default(25)
				}
			}
		}
	},
	{
		path: '/api/rudel/=/{id}/followers',
		method: 'GET',
		handler: RudelController.RouteHandlers.followers,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string()
				},
				query: {
					offset: Joi.number().min(0).default(0),
					limit: Joi.number().positive().max(100).default(25)
				}
			}
		}
	},
	{
		path: '/api/rudel/follow/{id}',
		method: 'POST',
		handler: RudelController.RouteHandlers.follow,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string()
				}
			}
		}
	},
	{
		path: '/api/rudel/unfollow/{id}',
		method: 'POST',
		handler: RudelController.RouteHandlers.unfollow,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string()
				}
			}
		}
	}
];
