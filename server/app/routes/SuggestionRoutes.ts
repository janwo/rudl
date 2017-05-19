import {UserRoles} from "../models/user/User";
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
		path: '/api/suggestions/rudel',
		method: 'GET',
		handler: SuggestionController.RouteHandlers.getRudelSuggestions,
		config: {
			auth: {
				scope: [
					UserRoles.user
				]
			}
		}
	}
];
