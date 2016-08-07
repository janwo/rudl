"use strict";
const Path = require("path");
exports.RouteConfig = [{
        method: 'GET',
        path: '/{path*}',
        config: {
            handler: {
                directory: {
                    path: Path.resolve('./../client/dist'),
                    listing: false,
                    index: true
                }
            },
            auth: false
        }
    }];
//# sourceMappingURL=StaticRoutes.js.map