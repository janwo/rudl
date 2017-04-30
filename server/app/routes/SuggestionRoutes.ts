import {UserRoles, UserValidation} from "../models/user/User";
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {SuggestionController} from "../controllers/SuggestionController";

export const RoutesConfig: RoutesConfiguration = [
	{
		path: '/api/suggestions/people',
		method: 'GET',
		handler: SuggestionController.RouteHandlers.getPeopleSuggestions,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	},
	{
		path: '/api/suggestions/username',
		method: 'POST',
		handler: SuggestionController.RouteHandlers.checkUsername,
		config: {
			auth: false,
			validate: {
				payload: {
					username: UserValidation.username
				}
			}
		}
	},
];
