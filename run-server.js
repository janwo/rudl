"use strict";
var serverApp_1 = require('./server/serverApp');
// Setup server.
var serverApp = new serverApp_1.ServerApp();
serverApp.setPublicDir(__dirname + '/client');
serverApp.setMongoUrl('mongodb://localhost:27017/eattogether');
serverApp.startServer();
//# sourceMappingURL=run-server.js.map