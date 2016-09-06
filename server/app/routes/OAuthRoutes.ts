import {Config} from "../../config/Config";
import {RoutesConfiguration} from "../../config/binders/RoutesBinder";
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");

export var RoutesConfig: RoutesConfiguration = [
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
