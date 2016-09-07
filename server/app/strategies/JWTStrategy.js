"use strict";
const Config_1 = require("../../config/Config");
const UserController = require("../controllers/UserController");
/*
 JWT is used for mobile applications. Actually it can be used in web apps as well, but due to the
 lack of security storing a JWT token securely, authentication via cookies is an alternative approach.
 */
exports.StrategyConfig = {
    isDefault: true,
    strategyName: 'jwt',
    schemeName: 'jwt',
    strategyConfig: {
        validateFunc: (decodedToken, request, callback) => {
            UserController.findByToken(decodedToken).then(user => {
                if (!user)
                    return callback(null, false);
                return callback(null, true, user);
            }).catch(err => {
                return callback(err, false);
            });
        },
        verifyOptions: {
            algorithms: ['HS256'],
            ignoreExpiration: true
        },
        key: Config_1.Config.jwt.salt
    }
};
//# sourceMappingURL=JWTStrategy.js.map