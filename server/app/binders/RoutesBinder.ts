import {RouteConfiguration, Server} from 'hapi';
import * as Glob from 'glob';
import * as Path from 'path';
import * as _ from 'lodash';
import {Config} from '../../../run/config';

export class RoutesBinder {
	
	public static bind(server: Server): void {
		let routes: RouteConfiguration[] = [];
		Glob.sync(Path.resolve(__dirname, `../routes/**/*.ts`)).forEach(file => {
			let config = require(file).RoutesConfig;
			if(!_.includes(Config.backend.excludeRoutes, config.name)) {
				console.log(`Add ${config.name} to active routes...`);
				routes = routes.concat(config.routes);
			}
		});
		
		server.route(routes);

		// Redirect to non-www route.
        server.ext('onRequest', (request, reply) => {
            if(request.info.hostname.startsWith('www.')) return reply.redirect(`${request.connection.info.protocol}://${request.info.hostname.substr(4)}${request.url.path}`);
            return reply.continue();
        });
	}
}

export interface RoutesConfiguration {
	name: string;
	routes: Array<RouteConfiguration>;
}
