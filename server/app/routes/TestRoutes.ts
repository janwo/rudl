import {RoutesConfiguration} from "../binders/RoutesBinder";
import {TestController} from "../controllers/TestController";

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/test/truncate/{collection?}',
		method: 'POST',
		handler: TestController.truncate,
		config: {
			auth: false
		}
	},
	{
		path: '/api/test/create-users/{count?}',
		method: 'POST',
		handler: TestController.createUsers,
		config: {
			auth: false
		}
	}
];
