import {Config} from "../../config/Config";
import {RoutesConfiguration} from "../../config/binders/RoutesBinder";
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");
import {UserController} from "../controllers/UserController";
import {UserRoles} from "../models/User";

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/suggest_username',
		method: 'POST',
		handler: UserController.RouteHandlers.checkUsername,
		config: {
			auth: false
		}
	},
	{
		path: '/api/sign_up',
		method: 'POST',
		handler: UserController.RouteHandlers.signUp,
		config: {
			auth: false
		}
	},
	{
		path: '/api/sign_in',
		method: 'POST',
		handler: UserController.RouteHandlers.signIn,
		config: {
			auth: {
				strategies: ['basic']
			}
		}
	},
	{
		path: '/api/sign_out',
		method: 'GET',
		handler: UserController.RouteHandlers.signOut,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: Config.providers.facebook.callbackURL,
		method: ['GET', 'POST'],
		handler: FacebookStrategy.handleFacebook,
		config: {
			auth: {
				strategies: ['facebook']
			}
		}
	},
	{
		path: Config.providers.twitter.callbackURL,
		method: ['GET', 'POST'],
		handler: TwitterStrategy.handleTwitter,
		config: {
			auth: {
				strategies: ['twitter']
			}
		}
	},
	{
		path: Config.providers.google.callbackURL,
		method: ['GET', 'POST'],
		handler: GoogleStrategy.handleGoogle,
		config: {
			auth: {
				strategies: ['google']
			}
		}
	}
];
