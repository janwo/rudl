import StaticRoutes = require("./StaticRoutes");
import UserRoutes = require("./UserRoutes");
import {Server} from "hapi";

export class RoutesBinder {
    private static endpoints = [].concat(
        StaticRoutes.RouteConfig,
        UserRoutes.RouteConfig
    );

    public static bind (server : Server) : void {
        server.route(this.endpoints);
    }
}
