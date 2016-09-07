"use strict";
const Config_1 = require("../../config/Config");
const StaticRoutes_1 = require("../routes/StaticRoutes");
const UserController = require("../controllers/UserController");
const Boom = require("boom");
exports.StrategyConfig = {
    isDefault: false,
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
        // Found? Done!
        if (user)
            return Promise.resolve(user);
        // Create User.
        return UserController.recommendUsername(profile.displayName.toLowerCase().replace(/[^a-z0-9-_]/g, '')).then(checkResults => {
            if (checkResults.available)
                return checkResults.username;
            return checkResults.recommendations[Math.trunc(Math.random() * checkResults.recommendations.length)];
        }).then(username => {
            return UserController.createUser({
                firstName: profile.name.given_name,
                lastName: profile.name.family_name,
                username: username,
                mail: profile.email
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
exports.handleGoogle = handleGoogle;
//# sourceMappingURL=GoogleStrategy.js.map