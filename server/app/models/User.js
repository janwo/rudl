"use strict";
const Database_1 = require("../../config/Database");
const Joi = require("joi");
class UserRoles {
}
UserRoles.user = 'user';
UserRoles.admin = 'admin';
exports.UserRoles = UserRoles;
exports.Validation = {
    username: Joi.string().min(5).max(16).regex(/^[a-z0-9-_\s]*$/).required(),
    mail: Joi.string().email().required(),
    password: Joi.string().min(6).max(32).required(),
    firstName: Joi.string().min(1).max(24),
    lastName: Joi.string().min(1).max(24)
};
exports.UserProvider = new Database_1.mongoClient.Schema({
    provider: { type: String, required: true },
    userIdentifier: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshBefore: { type: Number, default: null }
});
exports.User = Database_1.mongoClient.model('User', new Database_1.mongoClient.Schema({
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    username: { type: String, lowercase: true, required: true, index: true, unique: true },
    mails: {
        primary: { type: String, required: true, unique: true },
        secondary: { type: String, default: null }
    },
    scope: { type: [String], default: [UserRoles.user] },
    meta: { type: Array, default: [] },
    location: { type: String, default: null },
    auth: {
        password: { type: String, required: true },
        providers: { type: [exports.UserProvider], default: null }
    }
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
}));
//# sourceMappingURL=User.js.map