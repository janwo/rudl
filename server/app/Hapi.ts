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
import * as LetsEncrypt from 'greenlock-express';

export function hapiServer(): Promise<Hapi.Server>{
	// Create dirs.
	let dirs = [];
	
	// Get all dirs of uploads.
	Object.keys(Config.backend.uploads.paths).forEach(key => dirs.push(Config.backend.uploads.paths[key]));
	
	// Get dir of certificates
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
			// Create let's encrypt server.
			let letsEncrypt = LetsEncrypt.create({
				server: 'staging' /*https://acme-v01.api.letsencrypt.org/directory*/,
				configDir: Config.backend.ssl.certificatesDir,
				approveDomains: (opts, certs, cb) => {
					// Check domains and abort on error.
					for(let i = 0; i < opts.domains; i++) {
						if(opts.domains[i] != Config.backend.host) {
							cb(`Error generating certificates. The domain "${opts.domains[i]}" is not valid.`);
							return;
						}
					}
					
					opts.domains = certs && certs.altnames || opts.domains;
					opts.email = 'we@rudl.me';
					opts.agreeTos = true;
					
					cb(null, {
						options: opts,
						certs: certs
					});
				}
			}).listen(Config.backend.port);
			
			// Create HTTPS server.
			let httpsServer = Https.createServer(letsEncrypt.httpsOptions);
			
			// Create server connection.
			server.connection({
				listener: httpsServer,
				tls: true,
				autoListen: false
			});
			
			// Create endpoint for let's encrypt process.
			let acmeResponder = letsEncrypt.middleware();
			server.route({
				method: 'GET',
				path: '/.well-known/acme-challenge',
				handler: (request, reply) => {
					reply.close(false);
					acmeResponder(request.raw.req, request.raw.res);
				}
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
