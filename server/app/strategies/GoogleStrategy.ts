import {Config} from "../../config/Config";
import UserController = require("../controllers/UserController");
import {IUserProvider, IUser, User, UserRoles} from "../models/User";
import Boom = require("boom");

export var StrategyConfig = {
  strategyName: 'google',
  schemeName: 'bell',
  strategyConfig: {
    provider: 'google',
    password: Config.providers.google.password,
    clientId: Config.providers.google.clientID,
    clientSecret: Config.providers.google.clientSecret,
    isSecure: process.env.NODE_ENV === 'secure'
  }
};

/**
 * Controller handling [POST, GET] /api/login/google
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function handleGoogle(request, reply) : void {
  // Authenticated successful?
  if (!request.auth.isAuthenticated) reply(Boom.badRequest('Authentication failed: ' + request.auth.error.message));

  var profile = request.auth.credentials.profile;

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
      firstName: profile.raw.name.givenName,
      lastName: profile.raw.name.familyName,
      username: profile.username,
      mails: profile.emails,
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
