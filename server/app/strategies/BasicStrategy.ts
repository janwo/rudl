import UserController = require("../controllers/UserController");
import {IUser} from "../models/User";
import Boom = require("boom");
import {Config} from "../../config/Config";
import {StrategyConfiguration} from "../../config/binders/StrategiesBinder";

export var StrategyConfig : StrategyConfiguration = {
    isDefault: false,
    strategyName: 'basic',
    schemeName: 'basic',
    strategyConfig: {
        validateFunc: (request : any, username : string, password : string, callback : any) => {
            UserController.findByUsername(username, password).then((user : IUser) => {
                // User found?
                if (!user) return callback(null, false);
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
export function handleBasic(request : any, reply : any) : void {
    // Authenticated successful?
    if (!request.auth.isAuthenticated) reply(Boom.badRequest('Authentication failed: ' + request.auth.error.message));

    UserController.signToken(request.auth.credentials).then(token => {
        reply('Success').header("Authorization", token).state("token", token, {
            ttl: Config.jwt.expiresIn, // Requesting it here, although decoupled of the internal token expiry.
            encoding: 'none',
            isSecure: process.env.NODE_ENV === 'secure',
            isHttpOnly: true, // prevent client alteration
            clearInvalid: true, // remove invalid cookies
            strictHeader: true // don't allow violations of RFC 6265
        });
    });
}
