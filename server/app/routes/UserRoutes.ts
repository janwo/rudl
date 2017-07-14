import {UserRoles, UserValidation} from '../models/user/User';
import {RoutesConfiguration} from '../binders/RoutesBinder';
import {UserController} from '../controllers/UserController';
import * as Joi from 'joi';

const UsernameValidation = Joi.alternatives().try(UserValidation.username, Joi.string().regex(/^me$/));

export const RoutesConfig: RoutesConfiguration = {
	name: 'user-routes',
	routes: [
		{
			path: '/api/users/=/{username}',
			method: 'GET',
			handler: UserController.RouteHandlers.getUser,
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
			path: '/api/users/search/{query}',
			method: 'GET',
			handler: UserController.RouteHandlers.search,
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
			path: '/api/users/=/{username}/likers',
			method: 'GET',
			handler: UserController.RouteHandlers.likers,
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
			path: '/api/users/=/{username}/likees',
			method: 'GET',
			handler: UserController.RouteHandlers.likees,
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
			path: '/api/users/like/{user}',
			method: 'POST',
			handler: UserController.RouteHandlers.like,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				},
				validate: {
					params: {
						user: UserValidation.username
					}
				}
			}
		},
		{
			path: '/api/users/dislike/{user}',
			method: 'POST',
			handler: UserController.RouteHandlers.dislike,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				},
				validate: {
					params: {
						user: UserValidation.username
					}
				}
			}
		},
		{
			path: '/api/users/recent',
			method: 'GET',
			handler: UserController.RouteHandlers.recent,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				},
				validate: {
					query: {
						offset: Joi.number().min(0).default(0),
						limit: Joi.number().positive().max(100).default(25)
					}
				}
			}
		},
		{
			path: '/api/users/suggested',
			method: 'GET',
			handler: UserController.RouteHandlers.suggested,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				},
				validate: {
					query: {
						offset: Joi.number().min(0).default(0),
						limit: Joi.number().positive().max(100).default(25)
					}
				}
			}
		}
	]
};
