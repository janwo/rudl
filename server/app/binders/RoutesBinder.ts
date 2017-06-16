import {RouteConfiguration, Server} from 'hapi';
import * as Glob from 'glob';
import * as Path from 'path';
import * as _ from 'lodash';
import {Config} from '../../../run/config';

export class RoutesBinder {
	
	public static bind(server: Server): void {
		let routes: any[] = [];
		Glob.sync(Path.resolve(__dirname, `../routes/**/*.ts`)).forEach(file => {
			let config = require(file).RoutesConfig;
			if(!_.includes(Config.backend.excludeRoutes, config.name)) {
				console.log(`Add ${config.name} to active routes...`);
				routes = routes.concat(config.routes);
			}
		});
		
		server.route(routes);
	}
}

export interface RoutesConfiguration {
	name: string;
	routes: Array<RouteConfiguration>;
}
