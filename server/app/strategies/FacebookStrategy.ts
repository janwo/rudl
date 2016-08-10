import {Config} from "../../config/Config";
import UserController = require("../controllers/UserController");
import {User, IUser, UserRoles, IUserProvider} from "../models/User";
import Boom = require("boom");
import {StrategyConfiguration} from "../../config/binders/StrategiesBinder";

export var StrategyConfig : StrategyConfiguration = {
  isDefault: false,
  strategyName: 'facebook',
  schemeName: 'bell',
  strategyConfig: {
    provider: 'facebook',
    password: Config.providers.facebook.password,
    clientId: Config.providers.facebook.clientID,
    clientSecret: Config.providers.facebook.clientSecret,
    isSecure: process.env.NODE_ENV === 'secure'
  }
};

/**
 * Controller handling [POST, GET] /api/login/facebook
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function handleFacebook(request, reply) : void {
  // Authenticated successful?
  if (!request.auth.isAuthenticated) reply(Boom.badRequest('Authentication failed: ' + request.auth.error.message));

  var profile = request.auth.credentials;

  // Create provider.
  var provider : IUserProvider = {
    provider: StrategyConfig.strategyConfig.provider,
    userIdentifier: profile.id,
    accessToken: request.auth.credentials.token,
    refreshBefore: request.auth.credentials.expiresIn ? request.auth.credentials.expiresIn + Date.now() / 1000 : null,
    refreshToken: request.auth.credentials.refreshToken || undefined
  };

  UserController.findByProvider(provider).then((user : IUser) => {
    if(user) return Promise.resolve(user);

    return Promise.resolve(new User({
      firstName: profile.name.first,
      lastName: profile.name.last,
      username: profile.displayName,
      mails: [
        profile.email || profile.id + '@facebook.com'
      ],
      scope: [
        UserRoles.user
      ]
    }).save());
  }).then((user :IUser) => UserController.addProvider(user, provider))
      .then((user :IUser) => UserController.createRandomPassword(user, true))
      .then(UserController.signToken)
      .then(token => {
        reply({text: 'Check Auth Header for your Token'}).header("Authorization", token);
      }).catch(err => {
    reply(Boom.badData(err));
  });
}
