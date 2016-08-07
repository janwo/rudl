"use strict";
const Config_1 = require("../../config/Config");
const UserController = require("../controllers/UserController");
const User_1 = require("../models/User");
const Boom = require("boom");
exports.StrategyConfig = {
    strategyName: 'facebook',
    schemeName: 'bell',
    strategyConfig: {
        provider: 'facebook',
        password: Config_1.Config.providers.facebook.password,
        clientId: Config_1.Config.providers.facebook.clientID,
        clientSecret: Config_1.Config.providers.facebook.clientSecret,
        isSecure: process.env.NODE_ENV === 'secure'
    }
};
/**
 * Controller handling [POST, GET] /api/login/facebook
 * @param request Request-Object
 * @param reply Reply-Object
 */
function handleFacebook(request, reply) {
    // Authenticated successful?
    if (!request.auth.isAuthenticated)
        reply(Boom.badRequest('Authentication failed: ' + request.auth.error.message));
    var profile = request.auth.credentials;
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
            firstName: profile.name.first,
            lastName: profile.name.last,
            username: profile.displayName,
            mails: [
                profile.email || profile.id + '@facebook.com'
            ],
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
exports.handleFacebook = handleFacebook;
//# sourceMappingURL=FacebookStrategy.js.map