import redis = require("redis");
import {Config} from "./Config";
import {Database} from 'arangojs';

// Connect to arango.
let arangoClient = new Database({
	url: `http://${Config.db.arango.user}:${Config.db.arango.password}@${Config.db.arango.host}:${Config.db.arango.port}`,
	databaseName: Config.db.arango.database
});

// Connect to redis.
let redisClient = redis.createClient(Config.db.redis.port, Config.db.redis.host);

// Setup redis logging.
redisClient.on('ready', () => {
	console.log('Connected to redis successfully...');
	
	redisClient.on("monitor", (time, args) => {
		console.log(time + ": " + args);
	});
	
	redisClient.on("end", () => {
		console.log('Connection to redis ended...');
	});
	
	if (Config.log.databaseLogs.redis) {
		console.log('Listening on any errors within redis database...');
		redisClient.on('error', console.error);
	}
});

export {
	arangoClient,
	redisClient
};
