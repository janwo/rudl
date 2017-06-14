import {UserRoles} from '../models/user/User';
import {RoutesConfiguration} from '../binders/RoutesBinder';
import {SuggestionController} from '../controllers/SuggestionController';
import * as Joi from 'joi';

export const RoutesConfig: RoutesConfiguration = {
	name: 'suggestion-routes',
	routes: [
		{
			path: '/api/suggestions/people',
			method: 'GET',
			handler: SuggestionController.RouteHandlers.getPeopleSuggestions,
			config: {
				auth: {
					scope: [
						UserRoles.user
					]
				},
				validate: {
					query: {
						offset: Joi.number().min(0).default(0),
						limit: Joi.number().positive().max(100).default(25)
					}
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
				},
				validate: {
					query: {
						offset: Joi.number().min(0).default(0),
						limit: Joi.number().positive().max(100).default(25)
					}
				}
			}
		}
	]
};
