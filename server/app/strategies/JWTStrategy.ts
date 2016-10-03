import {Config} from "../../config/Config";
import {DecodedToken} from "../models/Token";
import {StrategyConfiguration} from "../../config/binders/StrategiesBinder";
import {UserController} from "../controllers/UserController";

/*
 JWT is used for mobile applications. Actually it can be used in web apps as well, but due to the
 lack of security storing a JWT token securely, authentication via cookies is an alternative approach.
 */

export const StrategyConfig: StrategyConfiguration = {
	isDefault: true,
	strategyName: 'jwt',
	schemeName: 'jwt',
	strategyConfig: {
		validateFunc: (decodedToken: DecodedToken, request, callback) => {
			UserController.findByToken(decodedToken).then(user => {
				if (!user) return callback(null, false);
				return callback(null, true, user);
			}).catch(err => {
				return callback(err, false);
			})
		},
		verifyOptions: {
			algorithms: ['HS256'],
			ignoreExpiration: true
		},
		key: Config.jwt.salt
	}
};
