import {UserRoles} from "../models/User";
import {Config} from "../../config/Config";
import Users = require('../../app/controllers/UserController');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");
import {RoutesConfiguration} from "../../config/binders/RoutesBinder";

export var RoutesConfig : RoutesConfiguration = [
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
    },
    {
        path: '/api/logout',
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
        path: '/api/login',
        method: 'POST',
        handler: BasicStrategy.handleBasic,
        config: {
            auth: {
                strategy: 'basic'
            }
        }
    },
    {
        path: Config.providers.facebook.callbackURL,
        method: ['GET', 'POST'],
        handler: FacebookStrategy.handleFacebook,
        config: {
            auth: {
                strategy: 'facebook'
            }
        }
    },
    {
        path: Config.providers.twitter.callbackURL,
        method: ['GET', 'POST'],
        handler: TwitterStrategy.handleTwitter,
        config: {
            auth: {
                strategy: 'twitter'
            }
        }
    },
    {
        path: Config.providers.google.callbackURL,
        method: ['GET', 'POST'],
        handler: GoogleStrategy.handleGoogle,
        config: {
            auth: {
                strategy: 'google'
            }
        }
    }
];
