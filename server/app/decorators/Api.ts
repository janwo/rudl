import {DecoratorsConfiguration} from '../binders/DecoratorsBinder';
import * as Boom from 'boom';
import {TransactionSession} from '../Database';

export const DecoratorsConfig: DecoratorsConfiguration = [
	{
		type: 'reply',
		property: 'api',
		method: function (input: Promise<any> | any, transactionSession: TransactionSession) {
			let respondWithError = (err: any) => {
				// Convert to Boom for proper api handling.
				if (err instanceof Error === false) err = Boom.badImplementation(err);
				if (!err.isBoom) err = Boom.badImplementation(err);
				console.log(err);
				this.response(err);
			};
			
			let respondWithSuccess = (data: any) => {
				let response: any = {};
				response['statusCode'] = 200;
				if (data) response['data'] = data;
				this.response(response);
			};
			
			// Response via transaction completion.
			if (transactionSession) return transactionSession.finishTransaction(input).then(data => {
				return respondWithSuccess(data);
			}, err => {
				return respondWithError(err);
			});
			
			// Response directly.
			return input.then(respondWithSuccess, respondWithError);
		}
	}
];
