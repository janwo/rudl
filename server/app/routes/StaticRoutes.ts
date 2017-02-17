import Path = require("path");
import {RoutesConfiguration} from "../binders/RoutesBinder";
import {Config, root} from "../../../run/config";
import {AssetsPool} from "../AssetsPool";

export const RoutesConfig: RoutesConfiguration = [
	{
		method: 'GET',
		path: '/static/assets/{path*}',
		handler: {
			directory: {
				path: Config.generatedFiles.frontendAssetsFolder,
				listing: Config.backend.debug,
				index: true
			}
		},
		config: {
			auth: false
		}
	},
	{
		method: 'GET',
		path: '/static/{path*}',
		handler: {
			directory: {
				path: Config.backend.uploads.paths.root,
				listing: Config.backend.debug,
				index: false
			}
		},
		config: {
			auth: false
		}
	},
	{
		method: 'GET',
		path: '/{path*}',
		handler: function (request, reply) {
			reply.view('index', {
				title: 'Welcome',
				assets: AssetsPool.getAssets(),
				metas: {
					'theme-color':  Config.frontend.themeColor,
					'msapplication-navbutton-color': Config.frontend.themeColor,
					'apple-mobile-web-app-status-bar-style': Config.frontend.themeColor
				}
			});
		},
		config: {
			auth: false
		}
	}
];
