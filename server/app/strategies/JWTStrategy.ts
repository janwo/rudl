import {Config} from '../../../run/config';
import {DecodedToken} from '../models/Token';
import {StrategyConfiguration} from '../binders/StrategiesBinder';
import {AuthController} from '../controllers/AuthController';
import {DatabaseManager} from "../DatabaseManager";
import {MonitorManager} from "../MonitorManager";
import {Counter} from "prom-client";

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
				if (!user) return callback(null, false);

				// Track new login?
                let key = AuthController.generateRedisKey(user.id, 'seen');
                DatabaseManager.redisClient.get(key, (err: any, reply: any) => {
                    if(reply) return callback(null, true, user);

                    // Track login.
                    let now = Date.now();
                    DatabaseManager.redisClient.set(key, now.toString(), 'EX', 60 * 60 * 24, () => {
                        (MonitorManager.metrics.seenUsers as Counter).inc(1, now);
                        callback(null, true, user);
                    });
                });
			}).catch(err => callback(null, false));
		},
		verifyOptions: {
			algorithms: ['HS256'],
			ignoreExpiration: true
		},
		key: Config.backend.salts.jwt
	}
};
