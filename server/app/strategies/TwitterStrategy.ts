import {Config} from "../../config/Config";
import UserController = require("../controllers/UserController");
import {User, IUserProvider, IUser, UserRoles} from "../models/User";
import Boom = require("boom");

export var StrategyConfig = {
  strategyName: 'twitter',
  schemeName: 'bell',
  strategyConfig: {
    provider: 'twitter',
    password: Config.providers.twitter.password,
    clientId: Config.providers.twitter.clientID,
    clientSecret: Config.providers.twitter.clientSecret,
    isSecure: process.env.NODE_ENV === 'secure'
  }
};

/**
 * Controller handling [POST, GET] /api/login/twitter
 * @param request Request-Object
 * @param reply Reply-Object
 */
export function handleTwitter(request : any, reply : any) : void {
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

    // Create the user profile
    var displayName = profile.displayName.trim();
    var iSpace = displayName.indexOf(' '); // index of the whitespace following the firstName
    var firstName =  iSpace !== -1 ? displayName.substring(0, iSpace) : displayName;
    var lastName = iSpace !== -1 ? displayName.substring(iSpace + 1) : '';

    return Promise.resolve(new User({
      firstName: firstName,
      lastName: lastName,
      mails: [], /* default, Twitter does not return mails in those requests */
      username: profile.username,
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
