"use strict";
const Fs = require('fs');
const Https = require('https');
const Hapi = require('hapi');
const Config_1 = require("./Config");
const RoutesBinder_1 = require("./binders/RoutesBinder");
const StrategiesBinder_1 = require("./binders/StrategiesBinder");
const DecoratorsBinder_1 = require("./binders/DecoratorsBinder");
const PluginsBinder_1 = require("./binders/PluginsBinder");
function hapiServer() {
    // Initialize Hapi server.
    let server = new Hapi.Server({
        cache: [
            {
                name: 'redisCache',
                engine: require('catbox-redis'),
                host: Config_1.Config.db.redis.host,
                port: Config_1.Config.db.redis.port,
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
            server.connection({ port: Config_1.Config.port });
            break;
        case 'secure':
            // Load SSL key and certificate.
            let privateKey = Fs.readFileSync('./config/sslcerts/key.pem', 'utf8');
            let certificate = Fs.readFileSync('./config/sslcerts/cert.pem', 'utf8');
            // Create HTTPS server.
            let httpsServer = Https.createServer({
                key: privateKey,
                cert: certificate,
                passphrase: Config_1.Config.passphrase
            });
            // Create server connection.
            server.connection({
                listener: httpsServer,
                tls: true,
                autoListen: true,
                port: Config_1.Config.port
            });
            break;
    }
    // Setup plugins.
    PluginsBinder_1.PluginsBinder.bind(server).then(() => {
        // Setup the authentication strategies.
        StrategiesBinder_1.StrategiesBinder.bind(server);
        // Setup the app router and static folder.
        RoutesBinder_1.RoutesBinder.bind(server);
        // Setup the decorators.
        DecoratorsBinder_1.DecoratorsBinder.bind(server);
        // Register views.
        server.views({
            engines: {
                html: require('handlebars')
            },
            path: './app/views'
        });
        // Start server.
        server.start(() => {
            console.log(`Server is running...`);
        });
    }).catch(err => console.error(err));
    return server;
}
exports.hapiServer = hapiServer;
//# sourceMappingURL=Hapi.js.map