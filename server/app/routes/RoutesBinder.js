"use strict";
const StaticRoutes = require("./StaticRoutes");
const UserRoutes = require("./UserRoutes");
class RoutesBinder {
    static bind(server) {
        server.route(this.endpoints);
    }
}
RoutesBinder.endpoints = [].concat(StaticRoutes.RouteConfig, UserRoutes.RouteConfig);
exports.RoutesBinder = RoutesBinder;
//# sourceMappingURL=RoutesBinder.js.map