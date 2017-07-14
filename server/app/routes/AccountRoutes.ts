import {UserRoles, UserSettingsValidation, UserValidation} from '../models/user/User';
import {RoutesConfiguration} from '../binders/RoutesBinder';
import {Config} from '../../../run/config';
import {AccountController} from '../controllers/AccountController';
import * as Joi from 'joi';
import {UserController} from '../controllers/UserController';

const UsernameValidation = Joi.alternatives().try(UserValidation.username, Joi.string().regex(/^me$/));

export const RoutesConfig: RoutesConfiguration = {
	name: 'account-routes',
	routes: [
		{
			path: '/api/account/update',
			method: 'POST',
			handler: AccountController.RouteHandlers.update,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				},
				validate: {
					payload: {
						profileText: UserValidation.profileText.optional(),
						firstName: UserValidation.firstName.optional(),
						lastName: UserValidation.lastName.optional(),
						username: UserValidation.username.optional()
					}
				}
			}
		},
		{
			path: '/api/account/avatar',
			method: 'POST',
			handler: AccountController.RouteHandlers.uploadAvatar,
			config: {
				payload: {
					output: 'stream',
					maxBytes: Config.backend.maxUploadBytes.avatars,
					parse: true,
					allow: 'multipart/form-data'
				},
				validate: {
					payload: {
						file: Joi.required()
					}
				},
				auth: {
					scope: [
						UserRoles.user
					]
				}
			}
		},
		{
			path: '/api/account/delete-avatar',
			method: 'POST',
			handler: AccountController.RouteHandlers.deleteAvatar,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				}
			}
		},
		{
			path: '/api/account/location',
			method: 'POST',
			handler: AccountController.RouteHandlers.updateLocation,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				},
				validate: {
					payload: {
						latitude: Joi.number().min(-90).max(90),
						longitude: Joi.number().min(-180).max(180)
					}
				}
			}
		},
		{
			path: '/api/account/settings',
			method: 'POST',
			handler: AccountController.RouteHandlers.updateSettings,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				},
				validate: {
					payload: {
						settings: UserSettingsValidation
					}
				}
			}
		},
		{
			path: '/api/account/settings',
			method: 'GET',
			handler: AccountController.RouteHandlers.settings,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				}
			}
		},
		{
			path: '/api/account/boarding',
			method: 'POST',
			handler: AccountController.RouteHandlers.updateBoarding,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				},
				validate: {
					payload: {
						boarded: Joi.boolean()
					}
				}
			}
		},
		{
			path: '/api/account/check-username/{username}',
			method: 'GET',
			handler: AccountController.RouteHandlers.checkUsername,
			config: {
				auth: false,
				validate: {
					params: {
						username: UserValidation.username
					}
				}
			}
		},
		{
			path: '/api/account/notifications',
			method: 'GET',
			handler: AccountController.RouteHandlers.notifications,
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
			path: '/api/account/terminate',
			method: 'POST',
			handler: AccountController.RouteHandlers.terminate,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				},
				validate: {
					payload: {
						username: UserValidation.username
					}
				}
			}
		}
	]
};
