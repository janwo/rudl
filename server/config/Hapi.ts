import Fs = require('fs');
import Https = require('https');
import Hapi = require('hapi');
import Logger = require('./Logger');
import Path = require('path');
import {Config} from "./Config";
import {RoutesBinder} from "../app/routes/RoutesBinder";
import {StrategyBinder} from "../app/strategies/StrategyBinder";

export function hapiServer() {

  // Initialize Hapi server.
  var server = new Hapi.Server({
    cache: [
      {
        name: 'redisCache',
        engine: require('catbox-redis'),
        host: Config.db.redis.host,
        port: Config.db.redis.port,
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

  switch (process.env.NODE_ENV) {
    default:
      // Create server connection.
      server.connection({port: Config.port});
      break;

    case 'secure': // Setup https server if NODE_ENV is secure.
      // Load SSL key and certificate.
      var privateKey = Fs.readFileSync('./config/sslcerts/key.pem', 'utf8');
      var certificate = Fs.readFileSync('./config/sslcerts/cert.pem', 'utf8');

      // Create HTTPS server.
      var httpsServer = Https.createServer({
        key: privateKey,
        cert: certificate,
        passphrase: Config.passphrase
      });

      // Create server connection.
      server.connection({
        listener: httpsServer,
        tls: true,
        autoListen: true,
        port: Config.port
      });
      break;
  }

  // Collect all plugins.
  var plugins : any = [
    {register: require('bell')},
    {register: require('inert')},
    {
      register: require('hapi-mongoose'),
      options: {
        uri: Config.db.mongo.host
      }
    },
    {register: require('vision')},
    {register: require('hapi-auth-jwt2')},
    {register: require('hapi-auth-basic')}
  ];

  if (Config.log.serverLogs.enabled) {
    plugins.push({
      register: require('good'),
      options: {
        reporters: {
          console: Logger.getLogReporters()
        }
      }
    });
  }

  // Register plugins.
  server.register(plugins, (err) => {
    if (err) console.error(err);

    // Setup the authentication strategies.
    StrategyBinder.bind(server);

    // Setting the app router and static folder.
    RoutesBinder.bind(server);

    // Register views.
    server.views({
      engines: {
        html: require('handlebars')
      },
      path: './app/views'
    });

    // Handle 404 errors.
    server.ext('onPreResponse', (request, reply) => {
      if (request.response.isBoom) {
        if(request.response.statusCode === 404)
          return reply.view('404', {
            url: request.url.path
          });
      }
      return reply.continue();
    });

    // Start server.
    server.start(() => {
      console.log(`Server is running...`);
    });
  });

  return server;
}
