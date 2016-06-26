"use strict";
var server_1 = require('./server/server');
// Setup server.
var serverApp = new server_1.ServerApp();
serverApp.setPublicDir(__dirname + '/client/dist');
serverApp.setMongoUrl('mongodb://localhost:27017/eattogether');
// Add in production settings.
if (process.env.NODE_ENV === "production") {
}
serverApp.startServer();
//# sourceMappingURL=run-server.js.map