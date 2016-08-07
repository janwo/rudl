"use strict";
const Config_1 = require("../../config/Config");
const UserController = require("../controllers/UserController");
const User_1 = require("../models/User");
const Boom = require("boom");
exports.StrategyConfig = {
    strategyName: 'google',
    schemeName: 'bell',
    strategyConfig: {
        provider: 'google',
        password: Config_1.Config.providers.google.password,
        clientId: Config_1.Config.providers.google.clientID,
        clientSecret: Config_1.Config.providers.google.clientSecret,
        isSecure: process.env.NODE_ENV === 'secure'
    }
};
/**
 * Controller handling [POST, GET] /api/login/google
 * @param request Request-Object
 * @param reply Reply-Object
 */
function handleGoogle(request, reply) {
    // Authenticated successful?
    if (!request.auth.isAuthenticated)
        reply(Boom.badRequest('Authentication failed: ' + request.auth.error.message));
    var profile = request.auth.credentials.profile;
    // Create provider.
    var provider = {
        provider: exports.StrategyConfig.strategyConfig.provider,
        userIdentifier: profile.id,
        accessToken: request.auth.credentials.token,
        refreshBefore: request.auth.credentials.expiresIn ? request.auth.credentials.expiresIn + Date.now() / 1000 : null,
        refreshToken: request.auth.credentials.refreshToken || undefined
    };
    UserController.findByProvider(provider).then((user) => {
        if (user)
            return Promise.resolve(user);
        return Promise.resolve(new User_1.User({
            firstName: profile.raw.name.givenName,
            lastName: profile.raw.name.familyName,
            username: profile.username,
            mails: profile.emails,
            scope: [
                User_1.UserRoles.user
            ]
        }).save());
    }).then((user) => UserController.addProvider(user, provider))
        .then((user) => UserController.createRandomPassword(user, true))
        .then(UserController.signToken)
        .then(token => {
        reply({ text: 'Check Auth Header for your Token' }).header("Authorization", token);
    }).catch(err => {
        reply(Boom.badData(err));
    });
}
exports.handleGoogle = handleGoogle;
//# sourceMappingURL=GoogleStrategy.js.map