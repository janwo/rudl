"use strict";
const User_1 = require("../models/User");
const Users = require('../../app/controllers/UserController');
exports.RoutesConfig = [
    {
        path: '/api/check_username',
        method: 'POST',
        handler: Users.checkUsername,
        config: {
            auth: false
        }
    },
    {
        path: '/api/sign_up',
        method: 'POST',
        handler: Users.signUp,
        config: {
            auth: false
        }
    },
    {
        path: '/api/sign_in',
        method: 'POST',
        handler: Users.signIn,
        config: {
            auth: {
                strategies: ['basic']
            }
        }
    },
    {
        path: '/api/sign_out',
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
    }
];
//# sourceMappingURL=UserRoutes.js.map