import {UserRoles} from "../models/User";
import {RoutesConfiguration} from "../../config/binders/RoutesBinder";
import UserController = require('../../app/controllers/UserController');
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/users/{username}',
		method: 'GET',
		handler: UserController.RouteHandlers.getUserOf,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/users/{username}/followers/{follower?}',
		method: 'GET',
		handler: UserController.RouteHandlers.getFollowers,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/users/{username}/following/{followee?}',
		method: 'GET',
		handler: UserController.RouteHandlers.getFollowees,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	}
];
