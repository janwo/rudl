"use strict";
const Config_1 = require("../../config/Config");
const UserController = require("../controllers/UserController");
const User_1 = require("../models/User");
const Boom = require("boom");
exports.StrategyConfig = {
    strategyName: 'twitter',
    schemeName: 'bell',
    strategyConfig: {
        provider: 'twitter',
        password: Config_1.Config.providers.twitter.password,
        clientId: Config_1.Config.providers.twitter.clientID,
        clientSecret: Config_1.Config.providers.twitter.clientSecret,
        isSecure: process.env.NODE_ENV === 'secure'
    }
};
/**
 * Controller handling [POST, GET] /api/login/twitter
 * @param request Request-Object
 * @param reply Reply-Object
 */
function handleTwitter(request, reply) {
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
        // Create the user profile
        var displayName = profile.displayName.trim();
        var iSpace = displayName.indexOf(' '); // index of the whitespace following the firstName
        var firstName = iSpace !== -1 ? displayName.substring(0, iSpace) : displayName;
        var lastName = iSpace !== -1 ? displayName.substring(iSpace + 1) : '';
        return Promise.resolve(new User_1.User({
            firstName: firstName,
            lastName: lastName,
            mails: [],
            username: profile.username,
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
exports.handleTwitter = handleTwitter;
//# sourceMappingURL=TwitterStrategy.js.map