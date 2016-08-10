"use strict";
const Path = require("path");
exports.RoutesConfig = [{
        method: 'GET',
        path: '/{path*}',
        handler: {
            directory: {
                path: Path.resolve('./../client/dist'),
                listing: false,
                index: true
            }
        },
        config: {
            auth: false
        }
    }];
//# sourceMappingURL=StaticRoutes.js.map