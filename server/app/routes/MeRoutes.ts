import {UserRoles} from "../models/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {UserController} from "../controllers/UserController";
import Joi = require('joi');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");
import {Config} from "../../../run/config";

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/me/followers',
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
		path: '/api/me/avatar',
		method: 'POST',
		handler: UserController.RouteHandlers.uploadAvatar,
		config: {
			payload: {
				output: 'stream',
				maxBytes: Config.backend.maxUploadBytes,
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
		path: '/api/me/following',
		method: 'GET',
		handler: UserController.RouteHandlers.getFollowees,
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
		handler: UserController.RouteHandlers.addFollowee,
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
		handler: UserController.RouteHandlers.deleteFollowee,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/me/suggestions/people',
		method: 'GET',
		handler: UserController.RouteHandlers.getPeopleSuggestions,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	}
];
