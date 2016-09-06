"use strict";
const Config_1 = require("../../config/Config");
const StaticRoutes_1 = require("../routes/StaticRoutes");
const UserController = require("../controllers/UserController");
const Boom = require("boom");
exports.StrategyConfig = {
    isDefault: false,
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
            return Promise.resolve(user);
        // Create User.
        return UserController.recommendUsername(profile.displayName.toLowerCase().replace(/[^a-z0-9-_]/g, '')).then(checkResults => {
            if (checkResults.available)
                return checkResults.username;
            return checkResults.recommendations[Math.floor(Math.random() * checkResults.recommendations.length)];
        }).then(username => {
            return UserController.createUser({
                firstName: profile.name.first,
                lastName: profile.name.last,
                username: username,
                mail: profile.email || profile.id + '@facebook.com'
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
exports.handleFacebook = handleFacebook;
//# sourceMappingURL=FacebookStrategy.js.map