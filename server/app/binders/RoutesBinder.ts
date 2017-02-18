import {Server, IRouteConfiguration} from "hapi";
import Glob = require("glob");
import Path = require('path');

export class RoutesBinder {
	
	public static bind(server: Server): void {
		let routes = [];
		Glob.sync(Path.resolve(__dirname, `../routes/**/*.js`)).forEach(file => {
			routes = routes.concat(require(file).RoutesConfig);
		});
		
		server.route(routes);
	}
}

export interface RoutesConfiguration extends Array<IRouteConfiguration> {
}
