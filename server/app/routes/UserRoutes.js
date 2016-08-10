"use strict";
const User_1 = require("../models/User");
const Config_1 = require("../../config/Config");
const Users = require('../../app/controllers/UserController');
const BasicStrategy = require("../strategies/BasicStrategy");
const FacebookStrategy = require("../strategies/FacebookStrategy");
const TwitterStrategy = require("../strategies/TwitterStrategy");
const GoogleStrategy = require("../strategies/GoogleStrategy");
exports.RoutesConfig = [
    {
        path: '/api/users/me',
        method: 'GET',
        handler: Users.me,
        config: {
            auth: {
                scope: [
                    User_1.UserRoles.user
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
                    User_1.UserRoles.user
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
                    User_1.UserRoles.user
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
        path: Config_1.Config.providers.facebook.callbackURL,
        method: ['GET', 'POST'],
        handler: FacebookStrategy.handleFacebook,
        config: {
            auth: {
                strategy: 'facebook'
            }
        }
    },
    {
        path: Config_1.Config.providers.twitter.callbackURL,
        method: ['GET', 'POST'],
        handler: TwitterStrategy.handleTwitter,
        config: {
            auth: {
                strategy: 'twitter'
            }
        }
    },
    {
        path: Config_1.Config.providers.google.callbackURL,
        method: ['GET', 'POST'],
        handler: GoogleStrategy.handleGoogle,
        config: {
            auth: {
                strategy: 'google'
            }
        }
    }
];
//# sourceMappingURL=UserRoutes.js.map