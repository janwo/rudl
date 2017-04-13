import {UserRoles} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {Config} from "../../../run/config";
import {AccountController} from "../controllers/AccountController";
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");

export const RoutesConfig: RoutesConfiguration = [
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
	}
];
