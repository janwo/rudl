import * as redis from "redis";
import {Config} from "../../run/config";
import {Database, Collection, Cursor} from "arangojs";
import * as http from "http";
import {TranslationsKeys} from "./models/Translations";
import {Document} from "./models/Document";
import {RedisClient} from 'redis';

export class DatabaseManager {
	
	static arangoCollections: any = {
		users: {
			name: 'users',
			type: 'document',
			indices: [
				{
					type: 'hash',
					fields: [
						'username'
					],
					unique: true,
					sparse: false
				},
				{
					type: 'fulltext',
					fields: [
						'meta.fulltextSearchData'
					]
				}
			]
		},
		activities: {
			name: 'activities',
			type: 'document',
			indices: TranslationsKeys.map(key => {
				return {
					type: 'fulltext',
					fields: [
						`translations.${key}`
					]
				};
			})
		},
		expeditions: {
			name: 'expeditions',
			type: 'document',
			indices: [
				{
					type: 'fulltext',
					fields: [
						'meta.fulltextSearchData'
					]
				}
			]
		},
		lists: {
			name: 'lists',
			type: 'document',
			indices: TranslationsKeys.map(key => {
				return {
					type: 'fulltext',
					fields: [
						`translations.${key}`
					]
				};
			})
		},
		userFollowsUser: {
			name: 'user-follows-user',
			type: 'edge'
		},
		userFollowsList: {
			name: 'user-follows-list',
			type: 'edge'
		},
		userOwnsList: {
			name: 'user-owns-list',
			type: 'edge'
		},
		userOwnsActivity: {
			name: 'user-owns-activity',
			type: 'edge'
		},
		userRatedActivity: {
			name: 'user-rated-activity',
			type: 'edge'
		},
		userFollowsActivity: {
			name: 'user-follows-activity',
			type: 'edge'
		},
		userOwnsExpedition: {
			name: 'user-owns-expedition',
			type: 'edge'
		},
		userJoinsExpedition: {
			name: 'user-joins-expedition',
			type: 'edge'
		},
		expeditionIsItem: {
			name: 'expedition-is-item',
			type: 'edge'
		},
		listIsItem: {
			name: 'list-is-item',
			type: 'edge'
		}
	};
	
	static arangoGraphs: any = {
		mainGraph: {
			name: 'mainGraph',
			vertices: [
				DatabaseManager.arangoCollections.users.name,
				DatabaseManager.arangoCollections.lists.name,
				DatabaseManager.arangoCollections.activities.name,
				DatabaseManager.arangoCollections.expeditions.name
			],
			relations: [
				{
					name: DatabaseManager.arangoCollections.userFollowsActivity.name,
					from: [DatabaseManager.arangoCollections.users.name],
					to: [DatabaseManager.arangoCollections.activities.name]
				},
				{
					name: DatabaseManager.arangoCollections.userOwnsActivity.name,
					from: [DatabaseManager.arangoCollections.users.name],
					to: [DatabaseManager.arangoCollections.activities.name]
				},
				{
					name: DatabaseManager.arangoCollections.userFollowsList.name,
					from: [DatabaseManager.arangoCollections.users.name],
					to: [DatabaseManager.arangoCollections.lists.name]
				},
				{
					name: DatabaseManager.arangoCollections.userOwnsList.name,
					from: [DatabaseManager.arangoCollections.users.name],
					to: [DatabaseManager.arangoCollections.lists.name]
				},
				{
					name: DatabaseManager.arangoCollections.listIsItem.name,
					from: [DatabaseManager.arangoCollections.lists.name],
					to: [DatabaseManager.arangoCollections.activities.name]
				},
				{
					name: DatabaseManager.arangoCollections.userFollowsUser.name,
					from: [DatabaseManager.arangoCollections.users.name],
					to: [DatabaseManager.arangoCollections.users.name]
				},
				{
					name: DatabaseManager.arangoCollections.userRatedActivity.name,
					from: [DatabaseManager.arangoCollections.users.name],
					to: [DatabaseManager.arangoCollections.activities.name]
				},
				{
					name: DatabaseManager.arangoCollections.expeditionIsItem.name,
					from: [DatabaseManager.arangoCollections.expeditions.name],
					to: [DatabaseManager.arangoCollections.activities.name]
				},
				{
					name: DatabaseManager.arangoCollections.userJoinsExpedition.name,
					from: [DatabaseManager.arangoCollections.users.name],
					to: [DatabaseManager.arangoCollections.expeditions.name]
				},
				{
					name: DatabaseManager.arangoCollections.userOwnsExpedition.name,
					from: [DatabaseManager.arangoCollections.users.name],
					to: [DatabaseManager.arangoCollections.expeditions.name]
				}
			]
		}
	};
	
	static arangoFunctions: any = (() => {
		let boundDocuments = (document: string, edgeCollection: string, direction: 'INBOUND' | 'OUTBOUND', limit: number = 0): Promise<any[]> => {
			let aqlQuery = `FOR result IN ${direction} @document @@edgeCollection ${limit > 0 ? 'LIMIT ' + limit : ''} RETURN result`;
			let aqlParams = {
				'@edgeCollection': edgeCollection,
				document: document
			};
			return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.all()) as any as Promise<any[]>;
		};
		
		return {
			updateOrCreate: <T extends Document>(document: T, collection: string): Promise<T> => {
				// Set new timestamps.
				let now = new Date().toISOString();
				document.updatedAt = now;
				if (!document._key) document.createdAt = now;
				
				let aqlQuery = document._key ?
					`REPLACE @document IN @@collection RETURN NEW` :
					`INSERT @document INTO @@collection RETURN NEW`;
				let aqlParams = {
					'@collection': collection,
					document: document
				};
				
				return DatabaseManager.arangoClient.query(aqlQuery, aqlParams).then((cursor: Cursor) => cursor.next()) as any as Promise<T>;
			},
			outbounds: (document: string, edgeCollection: string, limit = 0): Promise<any[]> => {
				return boundDocuments(document, edgeCollection, 'OUTBOUND', limit);
			},
			outbound: (document: string, edgeCollection: string): Promise<any> => {
				return boundDocuments(document, edgeCollection, 'OUTBOUND', 1).then(document => document.length > 0 ? document[0] : null);
			},
			inbounds: (document: string, edgeCollection: string, limit = 0): Promise<any[]> => {
				return boundDocuments(document, edgeCollection, 'INBOUND', limit);
			},
			inbound: (document: string, edgeCollection: string): Promise<any> => {
				return boundDocuments(document, edgeCollection, 'INBOUND', 1).then(document => document.length > 0 ? document[0] : null);
			}
		};
	})();
	
	private static RETRY_ARANGO_MILLIS = 1000;
	private static RETRY_REDIS_MILLIS = 1000;
	
	public static arangoClient: Database;
	public static redisClient: RedisClient;
	
	public static createArangoData(): Promise<any> {
		// Create collections.
		let collections = DatabaseManager.arangoClient.listCollections().then((existingCollections: any) => {
			let collections = Object.keys(DatabaseManager.arangoCollections).map((key: string) => DatabaseManager.arangoCollections[key]).filter((collection: any) => {
				// Filter collections.
				let exists = existingCollections.map((obj: any) => obj.name).indexOf(collection.name) >= 0;
				console.log(`Collection "${collection.name}" ${exists ? 'exists!' : 'does not exist!'}`);
				return !exists;
			}).map(missingCollection => {
				let collectionInstance: Collection = null;
				switch(missingCollection.type) {
					case 'edge':
						collectionInstance = DatabaseManager.arangoClient.edgeCollection(missingCollection.name);
						break;
					
					case 'document':
						collectionInstance = DatabaseManager.arangoClient.collection(missingCollection.name);
						break;
					
					default:
						return Promise.reject('Invalid collection type!');
				}
				// Create collection.
				return collectionInstance.create({}).then(() => {
					// Create indices.
					missingCollection.indices = missingCollection.indices || [];
					let indices = missingCollection.indices.map((index: any) => {
						switch (index.type) {
							case 'fulltext':
								return collectionInstance.createFulltextIndex(index.fields);
							case 'hash':
								return collectionInstance.createHashIndex(index.fields, {
									unique: index.unique || false,
									sparse: index.sparse || false
								});
							case 'geo':
								return collectionInstance.createHashIndex(index.fields, {
									geoJson: index.geoJson || false
								});
						}
						return Promise.reject('Invalid index type!');
					});
					return Promise.all(indices).then((values) => console.log(`Created all ${values.length} indices for "${missingCollection.name}" successfully.`));
				});
			});
			
			return Promise.all(collections).then((promises) => {
				console.log(`Created all ${promises.length} collections successfully.`);
				return promises;
			});
		});
		
		// Create graphs.
		let graphs = DatabaseManager.arangoClient.graphs().then((existingGraphs: any) => {
			// Filter graphs.
			let graphs = Object.keys(DatabaseManager.arangoGraphs).map((key: string) => DatabaseManager.arangoGraphs[key]).filter(graph => {
				let exists = existingGraphs.map((obj: any) => obj.name).indexOf(graph.name) >= 0;
				console.log(`Graph "${graph.name}" ${exists ? 'exists!' : 'does not exist!'}`);
				return !exists;
			}).map(missingGraph => {
				let graphInstance = missingGraph.instance = DatabaseManager.arangoClient.graph(missingGraph.name);
				return graphInstance.create({}).then(() => {
					// Create vertices.
					let i = 0;
					let addNext = (): Promise<any> => graphInstance.addVertexCollection(missingGraph.vertices[i]).then(() => {
						i++;
						if(i < missingGraph.vertices.length) return addNext();
					});
					return addNext();
				}).then(() => {
					let i = 0;
					let addNext = (): Promise<any> => graphInstance.addEdgeDefinition({
						collection: missingGraph.relations[i].name,
						from: missingGraph.relations[i].from,
						to: missingGraph.relations[i].to
					}).then(() => {
						i++;
						if(i < missingGraph.relations.length) return addNext();
					});
					return addNext();
				}).then(() => console.log(`Created graph "${missingGraph.name}" successfully`));
			});
			
			return Promise.all(graphs).then((promises) => {
				console.log(`Created all ${promises.length} graphs successfully.`);
				return promises;
		});
		});
		return collections.then(() => graphs);
	}
	
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
					console.log('Connected to arango successfully...');
					
					// Build arango database.
					DatabaseManager.arangoClient = new Database({
						url: `http://${Config.backend.db.arango.user}:${Config.backend.db.arango.password}@${Config.backend.db.arango.host}:${Config.backend.db.arango.port}`,
						databaseName: Config.backend.db.arango.database
					});
					
					arangoConnected = true;
				}).on('error', () => {
					// Retry.
					console.log(`Reconnect to arango in ${DatabaseManager.RETRY_ARANGO_MILLIS}ms...`);
					setTimeout(connectArango, DatabaseManager.RETRY_ARANGO_MILLIS);
				});
			};
			connectArango();
			
			// Connect to redis.
			DatabaseManager.redisClient = redis.createClient(Config.backend.db.redis.port, Config.backend.db.redis.host, {
				retry_strategy: () => {
					console.log(`Reconnect to redis in ${DatabaseManager.RETRY_REDIS_MILLIS}ms...`);
					return DatabaseManager.RETRY_REDIS_MILLIS;
				}
			});
			
			// Setup redis logging.
			DatabaseManager.redisClient.on('connect', () => {
				console.log('Connected to redis successfully...');
				redisConnected = true;
			});
			
			DatabaseManager.redisClient.on("monitor", (time: any, args: any) => {
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
