import {DecoratorsConfiguration} from "../binders/DecoratorsBinder";
import * as Boom from "boom";

export const DecoratorsConfig: DecoratorsConfiguration = [
	{
		type: 'reply',
		property: 'api',
		method: function (input: Promise<any> | any) {
			let respondWithSuccess = (data: any) => {
				let response: any = {};
				response['statusCode'] = 200;
				if(data) response['data'] = data;
				return this.response(response);
			};
			
			let respondWithError = (err: any) => {
				if (err instanceof Error === false) err = Boom.badImplementation(err);
				
				// Log.
				console.log(err.stack);
				
				// Convert to Boom for proper api handling.
				if (!err.isBoom) err = Boom.badImplementation(err);
				return this.response(err);
			};
			
			if (input instanceof Promise)
				return input.then(respondWithSuccess, respondWithError);
			else
				return input instanceof Error ? respondWithError(input) : respondWithSuccess(input);
		}
	}
];
