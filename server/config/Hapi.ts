import Fs = require('fs');
import Https = require('https');
import Hapi = require('hapi');
import Path = require('path');
import Handlebars = require('handlebars');
import {Config} from "./Config";
import {RoutesBinder} from "./binders/RoutesBinder";
import {StrategiesBinder} from "./binders/StrategiesBinder";
import {DecoratorsBinder} from "./binders/DecoratorsBinder";
import {PluginsBinder} from "./binders/PluginsBinder";

export function hapiServer() {

  // Initialize Hapi server.
  let server = new Hapi.Server({
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
      let privateKey = Fs.readFileSync('./config/sslcerts/key.pem', 'utf8');
      let certificate = Fs.readFileSync('./config/sslcerts/cert.pem', 'utf8');

      // Create HTTPS server.
      let httpsServer = Https.createServer({
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

  // Setup plugins.
  PluginsBinder.bind(server).then(() => {
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
      path: Path.join(__dirname, '../app/templates/views'),
      helpersPath: Path.join(__dirname, '../app/templates/helpers')
    });

    // Start server.
    server.start(() => {
      console.log(`Server is running...`);
    });
  }).catch(err => console.error(err));

  return server;
}
