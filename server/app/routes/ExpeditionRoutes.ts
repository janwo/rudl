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
		path: '/api/expeditions/by/{username}',
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
					username: UsernameValidation
				}
			}
		}
	},
	{
		path: '/api/expeditions/by/{username}/in/{activity}',
		method: 'GET',
		handler: ExpeditionController.RouteHandlers.getActivityExpeditionsBy,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					activity: Joi.string(),
					username: UsernameValidation
				}
			}
		}
	},
	{
		path: '/api/expeditions/nearby',
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
					radius: Joi.number().min(0)
				}
			}
		}
	},
	{
		path: '/api/expeditions/nearby/{activity}',
		method: 'GET',
		handler: ExpeditionController.RouteHandlers.getActivityExpeditionsNearby,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					activity: Joi.string(),
					radius: Joi.number().min(0)
				}
			}
		}
	},
	{
		path: '/api/expeditions/=/{key}',
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
					key: Joi.string()
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
					activity: Joi.string(),
					expedition: ExpeditionValidation
				}
			}
		}
	}
];
