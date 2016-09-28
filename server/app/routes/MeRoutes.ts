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
		path: '/api/me/followers/{follower}',
		method: 'GET',
		handler: UserController.getFollowees,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/me/following/{followee}',
		method: 'GET',
		handler: UserController.getFollowees,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/me/following/{followee}',
		method: 'PUT',
		handler: UserController.deleteFollower,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/me/following/{followee}',
		method: 'DELETE',
		handler: UserController.deleteFollower,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	}
];
