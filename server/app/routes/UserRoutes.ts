import {UserRoles} from "../models/User";
import {RoutesConfiguration} from "../../config/binders/RoutesBinder";
import UserController = require('../../app/controllers/UserController');
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");

export var RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/check-username',
		method: 'POST',
		handler: UserController.checkUsername,
		config: {
			auth: false
		}
	},
	{
		path: '/api/sign-up',
		method: 'POST',
		handler: UserController.signUp,
		config: {
			auth: false
		}
	},
	{
		path: '/api/sign-in',
		method: 'POST',
		handler: UserController.signIn,
		config: {
			auth: {
				strategies: ['basic']
			}
		}
	},
	{
		path: '/api/sign-out',
		method: 'GET',
		handler: UserController.signOut,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/users/{username}',
		method: 'GET',
		handler: UserController.getUser,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/users/{username}/following',
		method: 'GET',
		handler: UserController.getFollowees,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	}
];
