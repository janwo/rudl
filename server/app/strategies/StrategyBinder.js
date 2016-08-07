"use strict";
const FacebookStrategy = require("./FacebookStrategy");
const TwitterStrategy = require("./TwitterStrategy");
const GoogleStrategy = require("./GoogleStrategy");
const BasicStrategy = require("./BasicStrategy");
const JWTStrategy = require("./JWTStrategy");
class StrategyBinder {
    static bind(server) {
        this.strategies.forEach(function (strategy) {
            server.auth.strategy(strategy.strategyName, strategy.schemeName, strategy.strategyConfig);
        });
        server.auth.default(this.defaultStrategy.strategyName);
    }
}
StrategyBinder.strategies = [].concat(FacebookStrategy.StrategyConfig, GoogleStrategy.StrategyConfig, TwitterStrategy.StrategyConfig, JWTStrategy.StrategyConfig, BasicStrategy.StrategyConfig);
StrategyBinder.defaultStrategy = JWTStrategy.StrategyConfig;
exports.StrategyBinder = StrategyBinder;
//# sourceMappingURL=StrategyBinder.js.map