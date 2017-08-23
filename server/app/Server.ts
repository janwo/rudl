import {Config, root} from '../../run/config';
import {RoutesBinder} from './binders/RoutesBinder';
import {StrategiesBinder} from './binders/StrategiesBinder';
import {DecoratorsBinder} from './binders/DecoratorsBinder';
import {PluginsBinder} from './binders/PluginsBinder';
import {DatabaseManager} from './Database';
import * as Fs from 'fs';
import * as ge from 'greenlock-express';
import * as Path from 'path';
import {Server} from 'hapi';
import 'vision';
import {Schedule} from './Schedule';
import {MonitorManager} from "./MonitorManager";
import * as prometheus from 'prom-client';

export function server(): Promise<Server> {
	// Create dirs.
	let dirs: string[] = [];
	
	// Get all dirs of uploads.
	Object.keys(Config.paths).forEach(key => {
		let dir = Config.paths[key].dir;
		if (dir) dirs.push(dir);
	});
	
	// Create dirs.
	dirs.forEach(path => Fs.existsSync(path) || Fs.mkdirSync(path));
	
	// Initialize Hapi server.
	let server = new Server({
		cache: [
			{
				name: 'redis',
				engine: require('catbox-redis'),
				host: Config.backend.db.redis.host,
				port: Config.backend.db.redis.port
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

	// Enable SSL?
	if(Config.backend.ssl) {
		let gle = ge.create({
			app: () => {},
			debug: Config.debug,
			configDir: root('letsencrypt'),
			server: Config.debug ? 'staging': 'https://acme-v01.api.letsencrypt.org/directory',
			approveDomains: (opts: any, certs: any, cb: (x: any, y: any) => {}) => {
				if (certs) {
					opts.domains = certs.altnames;
				} else {
					let domain = /^(https?:\/\/)?[\d.]*([\S][^\/]+)/i.exec(Config.backend.domain)[2];
					opts.domains = [
						domain,
						`www.${domain}`
					];
					opts.email = Config.backend.mails.admin;
					opts.agreeTos = true;
				}

				cb(null, {options: opts, certs: certs});
			}
		}).listen(Config.backend.ports.http, Config.backend.ports.https);

		// Create server connection.
		server.connection({
			listener: gle,
			tls: true,
			autoListen: false
		});
	} else {
		// Use default
        server.connection({
            port: Config.backend.ports.http,
            host: Config.backend.host
        });
	}
	
	// Setup plugins.
	return PluginsBinder.bind(server).then(() => {
		// Setup the authentication strategies.
		StrategiesBinder.bind(server);
		
		// Setup the app router and static folder.
		RoutesBinder.bind(server);
		
		// Setup the decorators.
		DecoratorsBinder.bind(server);

		// Setup MonitorManager.
        MonitorManager.register(server);
        MonitorManager.metrics.seenUsers = new prometheus.Counter({
            name:'seen_users',
            help: 'Shows the number of unique users within 24 hours.'
        });

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
				hbs: require('handlebars')
			},
			path: Path.resolve(__dirname, './templates')
		});
		
		// Close database on exit.
		server.on('stop', () => DatabaseManager.disconnect());
		
		// Connect to database + create collections.
		return DatabaseManager.connect().then(() => {
			return DatabaseManager.createNeo4jData();
		});
	}).then(() => {
		console.log(`Setting up schedules...`);
		Schedule.start();
		
		return server.start().then(() => {
			console.log(`Server is running...`);
			return server;
		});
	});
}
