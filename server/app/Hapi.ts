import * as Handlebars from 'handlebars';
import {Config} from "../../run/config";
import {RoutesBinder} from "./binders/RoutesBinder";
import {StrategiesBinder} from "./binders/StrategiesBinder";
import {DecoratorsBinder} from "./binders/DecoratorsBinder";
import {PluginsBinder} from "./binders/PluginsBinder";
import {DatabaseManager} from "./Database";
import * as Fs from "fs";
import * as AutoSNI from "auto-sni";
import * as Path from 'path';
import {Server} from 'hapi';

export function hapiServer(): Promise<Server>{
	// Create dirs.
	let dirs: string[] = [];
	
	// Get all dirs of uploads.
	Object.keys(Config.paths).forEach(key => {
		let dir = Config.paths[key].dir;
		if(dir) dirs.push(dir);
	});
	
	// Create dirs.
	dirs.forEach(path => Fs.existsSync(path) || Fs.mkdirSync(path));
	
	// Initialize Hapi server.
	let server = new Server({
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
			// Load SSL key and certificate. TODO Respect conig domain
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
				let activatedPath: any = Object.keys(Config.paths).map((key: string) => Config.paths[key]).find((obj: any) => {
					return request.path.startsWith(obj.publicPath);
				});
				
				// Do we have an activated path and is the corresponding flag set, return file.
				if (activatedPath.ignore404) return reply.file(Path.resolve(activatedPath.dir, activatedPath.filename));
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
	}).then(() => server.start()).then(() => {
		console.log(`Server is running...`);
		return server;
	});
}

hapiServer().catch(err => console.error(err));
