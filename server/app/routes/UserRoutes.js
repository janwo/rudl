"use strict";
const User_1 = require("../models/User");
const Config_1 = require("../../config/Config");
const Users = require('../../app/controllers/UserController');
const BasicStrategy = require("../strategies/BasicStrategy");
const FacebookStrategy = require("../strategies/FacebookStrategy");
const TwitterStrategy = require("../strategies/TwitterStrategy");
const GoogleStrategy = require("../strategies/GoogleStrategy");
exports.RouteConfig = [
    {
        path: '/api/users/me',
        method: 'GET',
        config: {
            handler: Users.me,
            auth: {
                scope: [
                    User_1.UserRoles.user
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
                    User_1.UserRoles.user
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
                    User_1.UserRoles.user
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
        path: Config_1.Config.providers.facebook.callbackURL,
        method: ['GET', 'POST'],
        config: {
            handler: FacebookStrategy.handleFacebook,
            auth: {
                strategy: 'facebook'
            }
        }
    },
    {
        path: Config_1.Config.providers.twitter.callbackURL,
        method: ['GET', 'POST'],
        config: {
            handler: TwitterStrategy.handleTwitter,
            auth: {
                strategy: 'twitter'
            }
        }
    },
    {
        path: Config_1.Config.providers.google.callbackURL,
        method: ['GET', 'POST'],
        config: {
            handler: GoogleStrategy.handleGoogle,
            auth: {
                strategy: 'google'
            }
        }
    }
];
//# sourceMappingURL=UserRoutes.js.map