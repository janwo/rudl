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
import * as AutoSNI from 'auto-sni';

export function hapiServer(): Promise<Hapi.Server>{
	// Create dirs.
	let dirs = [];
	
	// Get all dirs of uploads.
	Object.keys(Config.paths).forEach(key => {
		let dir = Config.paths[key].dir;
		if(dir) dirs.push(dir);
	});
	
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
				debug: Config.debug,
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
		
		// Move all 404 errors within public routes to index file.
		server.ext('onPostHandler', (request: any, reply: any) => {
			
			// Catch 404 responses.
			if (request.response.isBoom && request.response.output.statusCode === 404) {
				let activatedPath = Object.keys(Config.paths).map(key => Config.paths[key]).find(obj => {
					return request.path.startsWith(obj.publicPath);
				});
				
				// Do we have an activated path and is the corresponding flag set, return file.
				if(activatedPath.ignore404) return reply.file(Path.resolve(activatedPath.dir, activatedPath.filename));
			}
			
			// Propagate 404 response.
			return reply.continue();
		});
		
		// Register views.
		server.views({
			engines: {
				handlebars: Handlebars
			},
			path: Path.resolve(__dirname, './templates/views')
		});
		
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
