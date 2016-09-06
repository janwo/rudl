"use strict";
const Boom = require("boom");
exports.DecoratorsConfig = [
    {
        type: 'reply',
        property: 'api',
        method: function (input) {
            let respondWithSuccess = (data) => {
                let response = {};
                response['statusCode'] = data ? 200 : 204;
                if (data)
                    response['data'] = data;
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
//# sourceMappingURL=Api.js.map