import {UserRoles, UserValidation} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {ExpeditionController} from "../controllers/ExpeditionController";
import * as Joi from 'joi';
import {ExpeditionValidation} from "../models/expedition/Expedition";

const UsernameValidation = Joi.alternatives().try(UserValidation.username, Joi.string().regex(/^me$/));

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/expeditions/like/{query}/{offset?}',
		method: 'GET',
		handler: ExpeditionController.RouteHandlers.like,
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
		path: '/api/expeditions/by/{username}/{offset?}',
		method: 'GET',
		handler: ExpeditionController.RouteHandlers.by,
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
		path: '/api/expeditions/by/{username}/in/{rudel}/{offset?}',
		method: 'GET',
		handler: ExpeditionController.RouteHandlers.getRudelExpeditionsBy,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					rudel: Joi.string(),
					username: UsernameValidation,
					offset: Joi.number().min(0).default(0)
				}
			}
		}
	},
	{
		path: '/api/expeditions/nearby/{offset?}',
		method: 'GET',
		handler: ExpeditionController.RouteHandlers.nearby,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					offset: Joi.number().min(0).default(0)
				}
			}
		}
	},
	{
		path: '/api/expeditions/near/{rudel}/{offset?}',
		method: 'GET',
		handler: ExpeditionController.RouteHandlers.getRudelExpeditionsNearby,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					rudel: Joi.string(),
					offset: Joi.number().min(0).default(0)
				}
			}
		}
	},
	{
		path: '/api/expeditions/=/{id}',
		method: 'GET',
		handler: ExpeditionController.RouteHandlers.get,
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
		path: '/api/expeditions/create',
		method: 'POST',
		handler: ExpeditionController.RouteHandlers.create,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					rudel: Joi.string(),
					expedition: ExpeditionValidation
				}
			}
		}
	}
];
