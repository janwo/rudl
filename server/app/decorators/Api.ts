import {DecoratorsConfiguration} from "../binders/DecoratorsBinder";
import * as Boom from "boom";

export const DecoratorsConfig: DecoratorsConfiguration = [
	{
		type: 'reply',
		property: 'api',
		method: function (input: Promise<any> | any) {
			let respondWithSuccess = (data) => {
				let response = {};
				response['statusCode'] = 200;
				if(data) response['data'] = data;
				return this.response(response);
			};
			
			let respondWithError = (err) => {
				if (err instanceof Error === false)
					err = Boom.badImplementation(err);
				else if (!err.isBoom)
					err = Boom.badImplementation(err.message);
				return this.response(err);
			};
			
			if (input instanceof Promise)
				return input.then(respondWithSuccess, respondWithError);
			else
				return input instanceof Error ? respondWithError(input) : respondWithSuccess(input);
		}
	}
];
