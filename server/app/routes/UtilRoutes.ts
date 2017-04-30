import {UserRoles} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import * as Joi from 'joi';
import {UtilController} from "../controllers/UtilController";

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/utils/icons',
		method: 'GET',
		handler: UtilController.RouteHandlers.getIcons,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	}
];
