"use strict";
const UserController = require("../controllers/UserController");
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
//# sourceMappingURL=BasicStrategy.js.map