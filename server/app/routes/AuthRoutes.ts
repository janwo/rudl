import {Config} from "../../../run/config";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {UserRoles, UserValidation} from "../models/users/User";
import {AuthController} from "../controllers/AuthController";
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");

export const RoutesConfig: RoutesConfiguration = [
	
	{
		path: '/api/sign_up',
		method: 'POST',
		handler: AuthController.RouteHandlers.signUp,
		config: {
			auth: false,
			validate: {
				payload: UserValidation
			}
		}
	},
	{
		path: '/api/sign_in',
		method: 'POST',
		handler: AuthController.RouteHandlers.signIn,
		config: {
			auth: {
				strategies: ['basic']
			}
		}
	},
	{
		path: '/api/sign_out',
		method: 'GET',
		handler: AuthController.RouteHandlers.signOut,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: Config.backend.providers.facebook.callbackURL,
		method: ['GET', 'POST'],
		handler: FacebookStrategy.handleFacebook,
		config: {
			auth: {
				strategies: ['facebook']
			}
		}
	},
	{
		path: Config.backend.providers.twitter.callbackURL,
		method: ['GET', 'POST'],
		handler: TwitterStrategy.handleTwitter,
		config: {
			auth: {
				strategies: ['twitter']
			}
		}
	},
	{
		path: Config.backend.providers.google.callbackURL,
		method: ['GET', 'POST'],
		handler: GoogleStrategy.handleGoogle,
		config: {
			auth: {
				strategies: ['google']
			}
		}
	}
];
