"use strict";
const Config_1 = require("../../config/Config");
const FacebookStrategy = require("../strategies/FacebookStrategy");
const TwitterStrategy = require("../strategies/TwitterStrategy");
const GoogleStrategy = require("../strategies/GoogleStrategy");
exports.RoutesConfig = [
    {
        path: Config_1.Config.providers.facebook.callbackURL,
        method: ['GET', 'POST'],
        handler: FacebookStrategy.handleFacebook,
        config: {
            auth: {
                strategies: ['facebook']
            }
        }
    },
    {
        path: Config_1.Config.providers.twitter.callbackURL,
        method: ['GET', 'POST'],
        handler: TwitterStrategy.handleTwitter,
        config: {
            auth: {
                strategies: ['twitter']
            }
        }
    },
    {
        path: Config_1.Config.providers.google.callbackURL,
        method: ['GET', 'POST'],
        handler: GoogleStrategy.handleGoogle,
        config: {
            auth: {
                strategies: ['google']
            }
        }
    }
];
//# sourceMappingURL=OAuthRoutes.js.map