"use strict";
const UserController = require("../controllers/UserController");
const Boom = require("boom");
const Config_1 = require("../../config/Config");
exports.StrategyConfig = {
    isDefault: false,
    strategyName: 'basic',
    schemeName: 'basic',
    strategyConfig: {
        validateFunc: (request, username, password, callback) => {
            UserController.findByUsername(username, password).then((user) => {
                // User found?
                if (!user)
                    return callback(null, false);
                return callback(null, true, user);
            }).catch(err => {
                return callback(err, false);
            });
        }
    }
};
/**
 * Controller handling [POST, GET] /api/login
 * @param request Request-Object
 * @param reply Reply-Object
 */
function handleBasic(request, reply) {
    // Authenticated successful?
    if (!request.auth.isAuthenticated)
        reply(Boom.badRequest('Authentication failed: ' + request.auth.error.message));
    UserController.signToken(request.auth.credentials).then(token => {
        reply('Success').header("Authorization", token).state("token", token, {
            ttl: Config_1.Config.jwt.expiresIn,
            encoding: 'none',
            isSecure: process.env.NODE_ENV === 'secure',
            isHttpOnly: true,
            clearInvalid: true,
            strictHeader: true // don't allow violations of RFC 6265
        });
    });
}
exports.handleBasic = handleBasic;
//# sourceMappingURL=BasicStrategy.js.map