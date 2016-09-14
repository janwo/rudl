import {UserRoles} from "../models/User";
import {RoutesConfiguration} from "../../config/binders/RoutesBinder";
import Users = require('../../app/controllers/UserController');
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");

export var RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/check-username',
		method: 'POST',
		handler: Users.checkUsername,
		config: {
			auth: false
		}
	},
	{
		path: '/api/sign-up',
		method: 'POST',
		handler: Users.signUp,
		config: {
			auth: false
		}
	},
	{
		path: '/api/sign-in',
		method: 'POST',
		handler: Users.signIn,
		config: {
			auth: {
				strategies: ['basic']
			}
		}
	},
	{
		path: '/api/sign-out',
		method: 'GET',
		handler: Users.signOut,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/users/me',
		method: 'GET',
		handler: Users.me,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	}, {
		path: '/api/user/{username}',
		method: 'GET',
		handler: Users.getUser,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	}
];
