import {User} from "../models/user/User";
import {StrategyConfiguration} from "../binders/StrategiesBinder";
import {AuthController} from '../controllers/AuthController';

export const StrategyConfig: StrategyConfiguration = {
	isDefault: false,
	strategyName: 'basic',
	schemeName: 'basic',
	strategyConfig: {
		validateFunc: (request: any, mail: string, password: string, callback: any) => {
			AuthController.authByMail(mail, password).then((user: User) => {
				if(!user) return callback(null, false);
				return callback(null, true, user);
			}).catch((err: any) => {
				console.log(err);
				callback(null, false)
			});
		}
	}
};
