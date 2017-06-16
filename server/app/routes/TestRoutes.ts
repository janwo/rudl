import {RoutesConfiguration} from '../binders/RoutesBinder';
import {TestController} from '../controllers/TestController';
import * as Joi from 'joi';

export const RoutesConfig: RoutesConfiguration = {
	name: 'test-routes',
	routes: [
		{
			path: '/api/test/create-users/{count?}',
			method: 'POST',
			handler: TestController.RouteHandlers.createUsers,
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
			path: '/api/test/create-rudel/{count?}',
			method: 'POST',
			handler: TestController.RouteHandlers.createRudel,
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
			handler: TestController.RouteHandlers.createUserFollowsUser,
			config: {
				auth: false,
				validate: {
					params: {
						count: Joi.number().min(0).max(100)
					}
				}
			}
		},
		{
			path: '/api/test/create-user-follows-rudel/{count?}',
			method: 'POST',
			handler: TestController.RouteHandlers.createUserFollowsRudel,
			config: {
				auth: false,
				validate: {
					params: {
						count: Joi.number().min(0).max(100)
					}
				}
			}
		}
	]
};
