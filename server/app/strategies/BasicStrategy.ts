import {UserController} from "../controllers/UserController";
import {User} from "../models/users/User";
import {StrategyConfiguration} from "../binders/StrategiesBinder";
import Boom = require("boom");

export const StrategyConfig: StrategyConfiguration = {
	isDefault: false,
	strategyName: 'basic',
	schemeName: 'basic',
	strategyConfig: {
		validateFunc: (request: any, username: string, password: string, callback: any) => {
			UserController.findByUsername(username).then((user: User) => UserController.checkPassword(user, password)).then((user: User) => {
				return callback(null, true, user);
			}).catch(err => {
				return callback(err, false);
			});
		}
	}
};
