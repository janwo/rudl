import {ServerApp} from './server/serverApp';

// Setup server.
var serverApp = new ServerApp();
serverApp.setPublicDir(__dirname + '/client');
serverApp.setMongoUrl('mongodb://localhost:27017/eattogether');
serverApp.startServer();
