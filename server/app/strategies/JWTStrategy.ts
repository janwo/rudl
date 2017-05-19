import {Config} from "../../../run/config";
import {DecodedToken} from "../models/Token";
import {StrategyConfiguration} from "../binders/StrategiesBinder";
import {AuthController} from '../controllers/AuthController';

/*
 JWT is used for mobile applications. Actually it can be used in web apps as well, but due to the
 lack of security storing a JWT token securely, authentication via cookies is an alternative approach.
 */

export const StrategyConfig: StrategyConfiguration = {
	isDefault: true,
	strategyName: 'jwt',
	schemeName: 'jwt',
	strategyConfig: {
		validateFunc: (decodedToken: DecodedToken, request: any, callback: any) => {
			AuthController.authByToken(decodedToken).then(user => {
				if(!user) return callback(null, false);
				return callback(null, true, user);
			}).catch(err => {
				console.log(err);
				callback(null, false)
			});
		},
		verifyOptions: {
			algorithms: ['HS256'],
			ignoreExpiration: true
		},
		key: Config.backend.salts.jwt
	}
};
