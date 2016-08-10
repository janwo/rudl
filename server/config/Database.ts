import mongoClient = require('mongoose');
import redis = require("redis");
import {Config} from "./Config";

// Connect to mongoose.
mongoClient.connect(`mongodb://${Config.db.mongo.user}:${Config.db.mongo.password}@${Config.db.mongo.host}:${Config.db.mongo.port}/${Config.db.mongo.database}`);

// Setup mongoose logging.
var mongoConnection = mongoClient.connection;
mongoConnection.once('open', () => {
    console.log(`Connected to mongo database "${Config.db.mongo.database}" as ${Config.db.mongo.user} successfully...`);

    if(Config.log.databaseLogs.mongo) {
        console.log('Listening on any errors within mongo database...');
        mongoConnection.on('error', console.error);
    }
});

// Connect to redis.
var redisClient = redis.createClient(Config.db.redis.port, Config.db.redis.host);

// Setup redis logging.
redisClient.on('ready', () => {
    console.log('Connected to redis successfully...');

    if(Config.log.databaseLogs.redis) {
        console.log('Listening on any errors within redis database...');
        redisClient.on('error', console.error);
    }
});

export {
    mongoClient,
    redisClient
};
