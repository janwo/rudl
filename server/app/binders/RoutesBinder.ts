import {Server, IRouteConfiguration} from "hapi";
import * as Glob from "glob";
import * as Path from 'path';

export class RoutesBinder {
	
	public static bind(server: Server): void {
		let routes: any[] = [];
		Glob.sync(Path.resolve(__dirname, `../routes/**/*.ts`)).forEach(file => {
			routes = routes.concat(require(file).RoutesConfig);
		});
		
		server.route(routes);
	}
}

export interface RoutesConfiguration extends Array<IRouteConfiguration> {
}
