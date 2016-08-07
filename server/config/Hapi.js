"use strict";
const Fs = require('fs');
const Https = require('https');
const Hapi = require('hapi');
const Logger = require('./Logger');
const Config_1 = require("./Config");
const RoutesBinder_1 = require("../app/routes/RoutesBinder");
const StrategyBinder_1 = require("../app/strategies/StrategyBinder");
function hapiServer() {
    // Initialize Hapi server.
    var server = new Hapi.Server({
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
            var privateKey = Fs.readFileSync('./config/sslcerts/key.pem', 'utf8');
            var certificate = Fs.readFileSync('./config/sslcerts/cert.pem', 'utf8');
            // Create HTTPS server.
            var httpsServer = Https.createServer({
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
    // Collect all plugins.
    var plugins = [
        { register: require('bell') },
        { register: require('inert') },
        {
            register: require('hapi-mongoose'),
            options: {
                uri: Config_1.Config.db.mongo.host
            }
        },
        { register: require('vision') },
        { register: require('hapi-auth-jwt2') },
        { register: require('hapi-auth-basic') }
    ];
    if (Config_1.Config.log.serverLogs.enabled) {
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
        if (err)
            console.error(err);
        // Setup the authentication strategies.
        StrategyBinder_1.StrategyBinder.bind(server);
        // Setting the app router and static folder.
        RoutesBinder_1.RoutesBinder.bind(server);
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
                if (request.response.statusCode === 404)
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
exports.hapiServer = hapiServer;
//# sourceMappingURL=Hapi.js.map