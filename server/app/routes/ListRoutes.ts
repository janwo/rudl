import {UserRoles, UserValidation} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {ListController} from "../controllers/ListController";
import {TranslationsValidation} from "../models/Translations";
import * as Joi from 'joi';
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
		path: '/api/lists/like/{query}/{offset?}',
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
		path: '/api/lists/=/{id}',
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
					id: Joi.string()
				}
			}
		}
	},
	{
		path: '/api/lists/=/{id}/rudel/{offset?}',
		method: 'GET',
		handler: ListController.RouteHandlers.getRudel,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string(),
					offset: Joi.number().min(0).default(0)
				}
			}
		}
	},
	{
		path: '/api/lists/map-of-rudel/{id}/{offset?}',
		method: 'GET',
		handler: ListController.RouteHandlers.getRudelMap,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string(),
					offset: Joi.number().min(0).default(0)
				}
			}
		}
	},
	{
		path: '/api/lists/add-rudel',
		method: 'POST',
		handler: ListController.RouteHandlers.addRudel,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					list: Joi.string(),
					rudel: Joi.string()
				}
			}
		}
	},
	{
		path: '/api/lists/delete-rudel',
		method: 'POST',
		handler: ListController.RouteHandlers.deleteRudel,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				payload: {
					list: Joi.string(),
					rudel: Joi.string()
				}
			}
		}
	},
	{
		path: '/api/lists/create',
		method: 'POST',
		handler: ListController.RouteHandlers.create,
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
		path: '/api/lists/=/{id}',
		method: 'POST',
		handler: ListController.RouteHandlers.update,
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
					translations: ListValidation.translations.optional()
				}
			}
		}
	},
	{
		path: '/api/lists/follow/{list}',
		method: 'POST',
		handler: ListController.RouteHandlers.follow,
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
		handler: ListController.RouteHandlers.unfollow,
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
		path: '/api/lists/=/{id}/followers/{offset?}',
		method: 'GET',
		handler: ListController.RouteHandlers.followers,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			},
			validate: {
				params: {
					id: Joi.string(),
					offset: Joi.number().min(0).default(0)
				}
			}
		}
	}
];
