"use strict";
const config_1 = require("./config");
const mongoClient = require('mongoose');
exports.mongoClient = mongoClient;
const redis = require("redis");
// Connect to mongoose.
mongoClient.connect('mongodb://' + config_1.Config.db.mongo.user + ':' + config_1.Config.db.mongo.password + '@' + config_1.Config.db.mongo.host + ':' + config_1.Config.db.mongo.port + '/' + config_1.Config.db.mongo.database);
// Setup mongoose logging.
var mongoConnection = mongoClient.connection;
mongoConnection.once('open', () => {
    console.log('Connected to mongo database "' + config_1.Config.db.mongo.database + '" as ' + config_1.Config.db.mongo.user + ' successfully...');
    if (config_1.Config.log.databaseLogs.mongo) {
        console.log('Listening on any errors within mongo database...');
        mongoConnection.on('error', console.error);
    }
});
// Connect to redis.
var redisClient = redis.createClient(config_1.Config.db.redis.port, config_1.Config.db.redis.host);
exports.redisClient = redisClient;
// Setup redis logging.
redisClient.on('ready', () => {
    console.log('Connected to redis successfully...');
    if (config_1.Config.log.databaseLogs.redis) {
        console.log('Listening on any errors within redis database...');
        redisClient.on('error', console.error);
    }
});
//# sourceMappingURL=Database.js.map