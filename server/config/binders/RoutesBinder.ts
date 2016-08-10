import {Server} from "hapi";
import glob = require("glob");
import {IRouteConfiguration} from "hapi";

export class RoutesBinder {

    public static bind (server : Server) : void {
        let routes = [];
        glob.sync(`${__dirname}/../../app/routes/**/*.js`).forEach(file => {
            routes = routes.concat(require(file).RoutesConfig);
        });

        server.route(routes);
    }
}

export interface RoutesConfiguration extends Array<IRouteConfiguration> {}
