import {UserRoles} from "../models/users/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");
import {Config} from "../../../run/config";
import {AccountController} from "../controllers/AccountController";

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
	}
];
