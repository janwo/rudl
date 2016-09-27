import UserController = require("../controllers/UserController");
import {User} from "../models/User";
import {StrategyConfiguration} from "../../config/binders/StrategiesBinder";
import Boom = require("boom");

export const StrategyConfig: StrategyConfiguration = {
	isDefault: false,
	strategyName: 'basic',
	schemeName: 'basic',
	strategyConfig: {
		validateFunc: (request: any, username: string, password: string, callback: any) => {
			UserController.findByUsername(username, password).then((user: User) => {
				// User found?
				if (!user) return callback(null, false);
				return callback(null, true, user);
			}).catch(err => {
				return callback(err, false);
			});
		}
	}
};
