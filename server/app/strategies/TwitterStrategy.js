"use strict";
const Config_1 = require("../../config/Config");
const StaticRoutes_1 = require("../routes/StaticRoutes");
const UserController = require("../controllers/UserController");
const Boom = require("boom");
exports.StrategyConfig = {
    isDefault: false,
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
        // Found? Done!
        if (user)
            return user;
        // Create the user profile
        var displayName = profile.displayName.trim();
        var iSpace = displayName.indexOf(' '); // index of the whitespace following the firstName
        var firstName = iSpace !== -1 ? displayName.substring(0, iSpace) : displayName;
        var lastName = iSpace !== -1 ? displayName.substring(iSpace + 1) : '';
        // Create User.
        return UserController.recommendUsername(profile.displayName.toLowerCase().replace(/[^a-z0-9-_]/g, '')).then(checkResults => {
            if (checkResults.available)
                return checkResults.username;
            return checkResults.recommendations[Math.random() * checkResults.recommendations.length];
        }).then(username => {
            return UserController.createUser({
                firstName: firstName,
                lastName: lastName,
                username: username,
                mail: null /* default, Twitter does not return mails in those requests */
            });
        });
    }).then((user) => UserController.addProvider(user, provider)).then(user => user.save()).then(UserController.signToken).then(token => {
        reply.view('index', {
            title: 'Authentication',
            assets: StaticRoutes_1.staticAssets,
            metas: {
                token: token
            }
        }).header("Authorization", token);
    }).catch(err => {
        reply(Boom.badRequest(err));
    });
}
exports.handleTwitter = handleTwitter;
//# sourceMappingURL=TwitterStrategy.js.map