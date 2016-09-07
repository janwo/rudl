"use strict";
const Glob = require("glob");
const Path = require('path');
class RoutesBinder {
    static bind(server) {
        let routes = [];
        Glob.sync(Path.join(__dirname, `../../app/routes/**/*.js`)).forEach(file => {
            routes = routes.concat(require(file).RoutesConfig);
        });
        server.route(routes);
    }
}
exports.RoutesBinder = RoutesBinder;
//# sourceMappingURL=RoutesBinder.js.map