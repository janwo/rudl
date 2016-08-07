"use strict";
const Config_1 = require("../../config/Config");
const UserController = require("../controllers/UserController");
exports.StrategyConfig = {
    strategyName: 'jwt',
    schemeName: 'jwt',
    strategyConfig: {
        validateFunc: (decodedToken, request, callback) => {
            UserController.findByToken(decodedToken).then(user => {
                if (!user)
                    return callback(new Error('Token is invalid.'), false);
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