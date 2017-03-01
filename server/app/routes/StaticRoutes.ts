import Path = require("path");
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {Config} from "../../../run/config";

export const RoutesConfig: RoutesConfiguration = [
	{
		method: 'GET',
		path: `${Config.paths.avatars.publicPath}{path*}`,
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
		method: 'GET',
		path: `${Config.paths.public.publicPath}{path*}`,
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
];
