"use strict";
import {ServerApp} from './server/server';

// Setup server.
var serverApp = new ServerApp();
serverApp.setPublicDir(__dirname + '/client/dist');
serverApp.setMongoUrl('mongodb://localhost:27017/eattogether');

// Add in production settings.
if(process.env.NODE_ENV === "production") {
    //serverApp.setPort(PORT);
    //serverApp.setMongoUrl('mongodb://localhost:27017/eattogether');
}

serverApp.startServer();
