import {UserRoles} from "../models/User";
import {Config} from "../../config/Config";
import Users = require('../../app/controllers/UserController');
import BasicStrategy = require("../strategies/BasicStrategy");
import FacebookStrategy = require("../strategies/FacebookStrategy");
import TwitterStrategy = require("../strategies/TwitterStrategy");
import GoogleStrategy = require("../strategies/GoogleStrategy");

export var RouteConfig = [
    {
        path: '/api/users/me',
        method: 'GET',
        config: {
            handler: Users.me,
            auth: {
                scope: [
                    UserRoles.user
                ]
            }
        }
    }, {
        path: '/api/user/{username}',
        method: 'GET',
        config: {
            handler: Users.getUser,
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
        config: {
            handler: Users.signOut,
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
        config: {
            handler: BasicStrategy.handleBasic,
            auth: {
                strategy: 'basic'
            }
        }
    },
    {
        path: Config.providers.facebook.callbackURL,
        method: ['GET', 'POST'],
        config: {
            handler: FacebookStrategy.handleFacebook,
            auth: {
                strategy: 'facebook'
            }
        }
    },
    {
        path: Config.providers.twitter.callbackURL,
        method: ['GET', 'POST'],
        config: {
            handler: TwitterStrategy.handleTwitter,
            auth: {
                strategy: 'twitter'
            }
        }
    },
    {
        path: Config.providers.google.callbackURL,
        method: ['GET', 'POST'],
        config: {
            handler: GoogleStrategy.handleGoogle,
            auth: {
                strategy: 'google'
            }
        }
    }
];
