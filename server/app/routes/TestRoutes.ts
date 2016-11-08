import {RoutesConfiguration} from "../binders/RoutesBinder";
import {TestController} from "../controllers/TestController";
import * as Joi from "joi";

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/test/truncate/{collection?}',
		method: 'POST',
		handler: TestController.truncate,
		config: {
			auth: false,
			validate: {
				params: {
					collection: Joi.string()
				}
			}
		}
	},
	{
		path: '/api/test/create-users/{count?}',
		method: 'POST',
		handler: TestController.createUsers,
		config: {
			auth: false,
			validate: {
				params: {
					count: Joi.number()
				}
			}
		}
	},
	{
		path: '/api/test/create-activities/{count?}',
		method: 'POST',
		handler: TestController.createActivities,
		config: {
			auth: false,
			validate: {
				params: {
					count: Joi.number()
				}
			}
		}
	},
	{
		path: '/api/test/create-user-follows-user/{count?}',
		method: 'POST',
		handler: TestController.createUserFollowsUser,
		config: {
			auth: false,
			validate: {
				params: {
					count: Joi.number()
				}
			}
		}
	},
	{
		path: '/api/test/create-user-follows-activity/{count?}',
		method: 'POST',
		handler: TestController.createUserFollowsActivity,
		config: {
			auth: false,
			validate: {
				params: {
					count: Joi.number()
				}
			}
		}
	}
];
