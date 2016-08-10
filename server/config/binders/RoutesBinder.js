"use strict";
const glob = require("glob");
class RoutesBinder {
    static bind(server) {
        let routes = [];
        glob.sync(`${__dirname}/../../app/routes/**/*.js`).forEach(file => {
            routes = routes.concat(require(file).RoutesConfig);
        });
        server.route(routes);
    }
}
exports.RoutesBinder = RoutesBinder;
//# sourceMappingURL=RoutesBinder.js.map