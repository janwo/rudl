import {DecoratorsConfiguration} from "../../config/binders/DecoratorsBinder";

export var DecoratorsConfig : DecoratorsConfiguration = [{
    type: 'reply',
    property: 'api',
    method: function (input : Promise<any> | any) {
        let respondWithSuccess = (data) => {
            return this.response({
                statusCode: 200,
                data: data
            });
        };

        let respondWithError = (err) => {
            if (err instanceof Error && err.isBoom) return this.response(err);
            return this.response(Boom.badImplementation(err));
        };

        if(input instanceof Promise)
            return input.then(respondWithSuccess, respondWithError);
        else
            return input instanceof Error ? respondWithSuccess(input) : respondWithError(input);
    }
}];
