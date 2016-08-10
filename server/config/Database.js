"use strict";
const mongoClient = require('mongoose');
exports.mongoClient = mongoClient;
const redis = require("redis");
const Config_1 = require("./Config");
// Connect to mongoose.
mongoClient.connect(`mongodb://${Config_1.Config.db.mongo.user}:${Config_1.Config.db.mongo.password}@${Config_1.Config.db.mongo.host}:${Config_1.Config.db.mongo.port}/${Config_1.Config.db.mongo.database}`);
// Setup mongoose logging.
var mongoConnection = mongoClient.connection;
mongoConnection.once('open', () => {
    console.log(`Connected to mongo database "${Config_1.Config.db.mongo.database}" as ${Config_1.Config.db.mongo.user} successfully...`);
    if (Config_1.Config.log.databaseLogs.mongo) {
        console.log('Listening on any errors within mongo database...');
        mongoConnection.on('error', console.error);
    }
});
// Connect to redis.
var redisClient = redis.createClient(Config_1.Config.db.redis.port, Config_1.Config.db.redis.host);
exports.redisClient = redisClient;
// Setup redis logging.
redisClient.on('ready', () => {
    console.log('Connected to redis successfully...');
    if (Config_1.Config.log.databaseLogs.redis) {
        console.log('Listening on any errors within redis database...');
        redisClient.on('error', console.error);
    }
});
//# sourceMappingURL=Database.js.map
