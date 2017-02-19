import Fs = require('fs');
import Https = require('https');
import Hapi = require('hapi');
import Path = require('path');
import Handlebars = require('handlebars');
import {Config} from "../../run/config";
import {RoutesBinder} from "./binders/RoutesBinder";
import {StrategiesBinder} from "./binders/StrategiesBinder";
import {DecoratorsBinder} from "./binders/DecoratorsBinder";
import {PluginsBinder} from "./binders/PluginsBinder";
import {DatabaseManager} from "./Database";
import {AssetsPool} from "./AssetsPool";
import * as AutoSNI from 'auto-sni';

export function hapiServer(): Promise<Hapi.Server>{
	// Create dirs.
	let dirs = [];
	
	// Get all dirs of uploads.
	Object.keys(Config.backend.uploads.paths).forEach(key => dirs.push(Config.backend.uploads.paths[key]));
	
	// Get dir of certificates.
	dirs.push(Config.backend.ssl.certificatesDir);
	
	// Create dirs.
	dirs.forEach(path => Fs.existsSync(path) || Fs.mkdirSync(path));
	
	// Initialize Hapi server.
	let server = new Hapi.Server({
		cache: [
			{
				name: 'redisCache',
				engine: require('catbox-redis'),
				host: Config.backend.db.redis.host,
				port: Config.backend.db.redis.port,
				partition: 'cache'
			}
		],
		connections: {
			router: {
				isCaseSensitive: true,
				stripTrailingSlash: true
			}
		}
	});
	
	console.log(`Server uses "${Config.env}" environment...`);
	switch (Config.env) {
		default:
			// Create server connection.
			server.connection({
				port: Config.backend.port,
				host: Config.backend.host
			});
			break;
		
		case 'secure':
			// Load SSL key and certificate.
			let autoSni = AutoSNI({
				email: 'we@rudl.me',
				agreeTos: true,
				debug: true,
				domains: [
					"rudl.me"
				],
				forceSSL: true,
				redirectCode: 301,
				ports: {
					http: 80,
					https: 443
				}
			});

			// Create server connection.
			server.connection({
				listener: autoSni,
				tls: true,
				autoListen: false
			});
			break;
	}
	
	// Setup plugins.
	return PluginsBinder.bind(server).then(() => {
		
		// Setup the authentication strategies.
		StrategiesBinder.bind(server);
		
		// Setup the app router and static folder.
		RoutesBinder.bind(server);
		
		// Setup the decorators.
		DecoratorsBinder.bind(server);
		
		// Register views.
		server.views({
			engines: {
				handlebars: Handlebars
			},
			path: Path.resolve(__dirname, './templates/views'),
			helpersPath: Path.resolve(__dirname, './templates/helpers')
		});
		
		// Update assets.
		if(Config.backend.watchAssets) AssetsPool.watchAssets();
		
		// Connect to database + create collections.
		return DatabaseManager.connect().then(() => DatabaseManager.createArangoData());
	}).then(() => {
		// Start server.
		server.start(() => {
			console.log(`Server is running...`);
			return server;
		});
	});
}
