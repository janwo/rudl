import FacebookStrategy = require("./FacebookStrategy");
import TwitterStrategy = require("./TwitterStrategy");
import GoogleStrategy = require("./GoogleStrategy");
import BasicStrategy = require("./BasicStrategy");
import JWTStrategy = require("./JWTStrategy");
import {Server} from "hapi";

export class StrategyBinder {
  private static strategies = [].concat(
    FacebookStrategy.StrategyConfig,
    GoogleStrategy.StrategyConfig,
    TwitterStrategy.StrategyConfig,
    JWTStrategy.StrategyConfig,
    BasicStrategy.StrategyConfig
  );

  private static defaultStrategy = JWTStrategy.StrategyConfig;

  public static bind (server : Server) {
    this.strategies.forEach(function (strategy) {
      server.auth.strategy(strategy.strategyName, strategy.schemeName, strategy.strategyConfig);
    });

    server.auth.default(this.defaultStrategy.strategyName);
  }
}
