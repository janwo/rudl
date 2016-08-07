"use strict";
const Database_1 = require("../../config/Database");
exports.UserProvider = new Database_1.mongoClient.Schema({
    provider: String,
    userIdentifier: String,
    accessToken: String,
    refreshBefore: Number
});
exports.UserSchema = new Database_1.mongoClient.Schema({
    firstName: String,
    lastName: String,
    username: { type: String, required: true, unique: true },
    mails: [String],
    scope: Array,
    meta: Array,
    location: String,
    auth: {
        password: String,
        providers: [exports.UserProvider]
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});
class UserRoles {
}
UserRoles.user = 'user';
UserRoles.admin = 'admin';
exports.UserRoles = UserRoles;
exports.User = Database_1.mongoClient.model('User', exports.UserSchema);
//# sourceMappingURL=User.js.map