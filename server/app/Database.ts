import redis = require("redis");
import {Config} from "../../run/config";
import {Database} from 'arangojs';
import * as http from "http";
import {RedisClient} from "redis";

export const arangoCollections = {
	users: 'users',
	userFollowsUser: 'user-follows-user',
	userFollowsList: 'user-follows-list',
	userOwnsList: 'user-owns-list',
	userRatedActivity: 'user-rated-activity',
	userFollowsActivity: 'user-follows-activity',
	activities: 'activities',
	lists: 'lists',
	listIsItem: 'list-is-item'
};

const RETRY_ARANGO_MILLIS = 1000;
const RETRY_REDIS_MILLIS = 1000;

export class DatabaseManager {
	
	public static arangoClient: Database;
	public static redisClient: RedisClient;
	
	public static connect(): Promise<void> {
		return new Promise<void>(resolve => {
			let arangoConnected = false;
			let redisConnected = false;
			
			// Wait for arango.
			let connectArango = () => {
				// Create arango url.
				let arangoURL = `http://${Config.backend.db.arango.user}:${Config.backend.db.arango.password}@${Config.backend.db.arango.host}:${Config.backend.db.arango.port}`;
				
				// Is the arango server running?
				http.get(`${arangoURL}/_api/version`, () => {
					// Connect to arango.
					DatabaseManager.arangoClient = new Database({
						url: `http://${Config.backend.db.arango.user}:${Config.backend.db.arango.password}@${Config.backend.db.arango.host}:${Config.backend.db.arango.port}`,
						databaseName: Config.backend.db.arango.database
					});
					
					console.log('Connected to arango successfully...');
					arangoConnected = true;
				}).on('error', () => {
					// Retry.
					console.log(`Reconnect to arango in ${RETRY_ARANGO_MILLIS}ms...`);
					setTimeout(connectArango, RETRY_ARANGO_MILLIS);
				});
			};
			connectArango();
			
			// Connect to redis.
			DatabaseManager.redisClient = redis.createClient(Config.backend.db.redis.port, Config.backend.db.redis.host, {
				retry_strategy: () => {
					console.log(`Reconnect to redis in ${RETRY_REDIS_MILLIS}ms...`);
					return RETRY_REDIS_MILLIS;
				}
			});
			
			// Setup redis logging.
			DatabaseManager.redisClient.on('connect', () => {
				console.log('Connected to redis successfully...');
				redisConnected = true;
			});
			
			DatabaseManager.redisClient.on("monitor", (time, args) => {
				console.log(time + ": " + args);
			});
			
			DatabaseManager.redisClient.on("end", () => {
				console.log('Connection to redis ended...');
			});
			
			if (Config.backend.log.databaseLogs.redis) {
				console.log('Listening on any errors within redis database...');
				DatabaseManager.redisClient.on('error', console.error);
			}
			
			let wait = setInterval(() => {
				if (arangoConnected && redisConnected) {
					clearInterval(wait);
					resolve();
				}
			}, 1000);
		});
	}
}
