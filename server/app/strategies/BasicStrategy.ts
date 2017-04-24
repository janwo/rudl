import {UserController} from "../controllers/UserController";
import {User} from "../models/user/User";
import {StrategyConfiguration} from "../binders/StrategiesBinder";
import {AccountController} from "../controllers/AccountController";

export const StrategyConfig: StrategyConfiguration = {
	isDefault: false,
	strategyName: 'basic',
	schemeName: 'basic',
	strategyConfig: {
		validateFunc: (request: any, username: string, password: string, callback: any) => {
			UserController.findByUsername(username).then((user: User) => {
				if(!user) return callback(null, false);
				return AccountController.checkPassword(user, password);
			}).then((user: User) => {
				return callback(null, true, user);
			}).catch(err => callback(null, false));
		}
	}
};
