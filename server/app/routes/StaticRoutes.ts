import {RoutesConfiguration} from '../binders/RoutesBinder';
import {Config} from '../../../run/config';
import 'inert';

export const RoutesConfig: RoutesConfiguration = {
	name: 'static-routes',
	routes: [
		{
			path: `${Config.paths.icons.publicPath}{path*}`,
			method: 'GET',
			handler: {
				directory: {
					path: Config.paths.icons.dir,
					listing: Config.debug
				}
			},
			config: {
				auth: false
			}
		},
		{
			path: `${Config.paths.avatars.publicPath}{path*}`,
			method: 'GET',
			handler: {
				directory: {
					path: Config.paths.avatars.dir,
					listing: Config.debug
				}
			},
			config: {
				auth: false
			}
		},
		{
			path: `${Config.paths.public.publicPath}{path*}`,
			method: 'GET',
			handler: {
				directory: {
					path: Config.paths.public.dir,
					index: Config.paths.public.filename,
					listing: Config.debug
				}
			},
			config: {
				auth: false
			}
		}
	]
};
