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

export function hapiServer(): Promise<Hapi.Server>{
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
		
		case 'secure': // Setup https server if NODE_ENV is secure.
			// Load SSL key and certificate.
			let privateKey = Fs.readFileSync('./sslcerts/key.pem', 'utf8'); //TODO
			let certificate = Fs.readFileSync('./sslcerts/cert.pem', 'utf8'); //TODO
			
			// Create HTTPS server.
			let httpsServer = Https.createServer({
				key: privateKey,
				cert: certificate,
				passphrase: Config.backend.ssl.passphrase
			});
			
			// Create server connection.
			server.connection({
				listener: httpsServer,
				tls: true,
				autoListen: true,
				port: Config.backend.port
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
			path: Path.join(__dirname, './templates/views'),
			helpersPath: Path.join(__dirname, './templates/helpers')
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
