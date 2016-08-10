"use strict";
const glob = require("glob");
class StrategiesBinder {
    static bind(server) {
        let defaultStrategiesFound = 0;
        glob.sync(`${__dirname}/../../app/strategies/**/*.js`).forEach(file => {
            // Configure strategy.
            let config = require(file).StrategyConfig;
            server.auth.strategy(config.strategyName, config.schemeName, config.strategyConfig);
            // Set as default strategy?
            if (config.isDefault) {
                defaultStrategiesFound++;
                server.auth.default(config.strategyName);
            }
        });
        // Is there exact one default strategy defined?
        if (defaultStrategiesFound != 1)
            throw (new Error(`${defaultStrategiesFound} strategies found! Exact one strategy needs to be declared as default. Aborting startup...`));
    }
}
exports.StrategiesBinder = StrategiesBinder;
//# sourceMappingURL=StrategiesBinder.js.map