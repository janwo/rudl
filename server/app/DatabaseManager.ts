import * as redis from 'redis';
import {RedisClient} from 'redis';
import {Config} from '../../run/config';
import {TranslationsKeys} from './models/Translations';
import {Node} from './models/Node';
import * as Dot from 'dot-object';
import * as _ from 'lodash';
import {Relationship} from './models/Relationship';
import Record from 'neo4j-driver/types/v1/record';
import Neo4j from 'neo4j-driver';
import Session from 'neo4j-driver/types/v1/session';
import Transaction from 'neo4j-driver/types/v1/transaction';
import {Driver} from "neo4j-driver/types/v1/driver";
const DOT_DELIMITER = '_';
const dot = new Dot(DOT_DELIMITER);

export class DatabaseManager {
	
	static neo4jCollections: any = {
		users: {
			name: 'User',
			isRelationship: false,
			indices: [
				'password'
			],
			uniqueness: [
				'username',
				'id',
				'mail'
			],
            spatial: {
                longitude: 'location_longitude',
                latitude: 'location_latitude'
            },
			fulltext: {
				User: [
					'username',
					'firstName',
					'lastName'
				]
			}
		},
		userAuthProvider: {
			name: 'UserAuthProvider',
			isRelationship: false,
			indices: [
				'provider',
				'identifier'
			]
		},
		userUsesAuthProvider: {
			name: 'USES_AUTH_PROVIDER',
			isRelationship: true
		},
		rudel: {
			name: 'Rudel',
			isRelationship: false,
			indices: TranslationsKeys.map(key => `translations_${key}`),
			uniqueness: [
				'id'
			],
			fulltext: {
				Rudel: [
					'translations_de',
					'translations_en',
					'translations_es',
					'translations_fr'
				]
			}
		},
		expeditions: {
			name: 'Expedition',
			isRelationship: false,
			uniqueness: [
				'id'
			],
			spatial: {
				longitude: 'location_longitude',
				latitude: 'location_latitude'
			},
			indices: [
				'date',
				'needsApproval'
			],
			fulltext: {
				Expedition: [
					'title',
					'description'
				]
			}
		},
		lists: {
			name: 'List',
			isRelationship: false,
			indices: TranslationsKeys.map(key => `translations_${key}`),
			uniqueness: [
				'id'
			],
			fulltext: {
				List: [
					'translations_de',
					'translations_en',
					'translations_es',
					'translations_fr'
				]
			}
		},
		userLikesUser: {
			name: 'LIKES_USER',
			isRelationship: true
		},
		userDislikesUser: {
			name: 'DISLIKES_USER',
			isRelationship: true
		},
		userLikesList: {
			name: 'LIKES_LIST',
			isRelationship: true
		},
		userDislikesList: {
			name: 'DISLIKES_LIST',
			isRelationship: true
		},
		userOwnsList: {
			name: 'OWNS_LIST',
			isRelationship: true
		},
		userOwnsRudel: {
			name: 'OWNS_RUDEL',
			isRelationship: true
		},
		userLikesRudel: {
			name: 'LIKES_RUDEL',
			isRelationship: true
		},
		userDislikesRudel: {
			name: 'DISLIKES_RUDEL',
			isRelationship: true
		},
		userOwnsExpedition: {
			name: 'OWNS_EXPEDITION',
			isRelationship: true
		},
		userJoinsExpedition: {
			name: 'JOINS_EXPEDITION',
			isRelationship: true
		},
		userPossiblyJoinsExpedition: {
			name: 'POSSIBLY_JOINS_EXPEDITION',
			isRelationship: true
		},
		expeditionBelongsToRudel: {
			name: 'BELONGS_TO_RUDEL',
			isRelationship: true
		},
		rudelBelongsToList: {
			name: 'BELONGS_TO_LIST',
			isRelationship: true
		},
        userOwnsComment: {
            name: 'OWNS_COMMENT',
            isRelationship: true
        },
        recommendeeOfExpedition: {
            name: 'RECOMMENDEE_OF_EXPEDITION',
            isRelationship: true
        },
		commentBelongsToNode: {
			name: 'BELONGS_TO_NODE',
			isRelationship: true
		},
		comments: {
			name: 'Comment',
			isRelationship: false,
			uniqueness: [
				'id'
			],
			indices: [
				'createdAt',
			]
		},
		notificationRecipient: {
			name: 'NOTIFICATION_RECIPIENT',
			isRelationship: true
		},
		notificationSubject: {
			name: 'NOTIFICATION_SUBJECT',
			isRelationship: true
		},
		notificationSender: {
			name: 'NOTIFICATION_SENDER',
			isRelationship: true
		},
		notification: {
			name: 'Notification',
			isRelationship: false,
			indices: [
                'createdAt',
                'hasSender'
			]
		},
		settings: {
			name: 'Settings',
			isRelationship: false
		},
		userSettings: {
			name: 'USER_SETTINGS',
			isRelationship: true
		}
	};

	static neo4jFunctions: any = {
        unflatten: <L extends Node | Relationship | any>(record: Record | Record[], returnVariable: string): L | L[] => {
            if (record instanceof Array) return record.map((record => DatabaseManager.neo4jFunctions.unflatten(record, returnVariable)));
            let $return = record.get(returnVariable) as any;

            let convert = (obj: any) => {
                if (typeof obj == 'object') {
                    if (Neo4j.isInt(obj)) return obj.toNumber();
                    if (obj instanceof Array) return obj.map(obj => convert(obj));
                    for (let key in obj) {
                        if (!obj.hasOwnProperty(key)) continue;
                        obj[key] = convert(obj[key]);
                        if(key.indexOf(DOT_DELIMITER) < 0) continue;
                        dot.str(key, obj[key], obj);
                        delete obj[key];
                    }
                }

                return obj;
            };

            return convert($return);
        },
        flatten: <T extends Node | Relationship>(document: T): any | any[] => {
            if (document instanceof Array) return document.map((document => DatabaseManager.neo4jFunctions.flatten(document)));
            return (document ? dot.dot(document) : null) as any;
        },
        escapeLucene: (str: string) => {
            return str.replace(/([\-\|\~\*\?\+\/\!\^\:\"\(\)\{\}\[\]\\&])/gi, match => '\\' + match);
        }
    };
	
	private static RETRY_MILLIS = 3000;
	
	public static neo4jClient: Driver;
	public static redisClient: RedisClient;
	public static onlineStatus: { [key: string]: boolean } = {
		redisClient: false,
		neo4jClient: false
	};
	
	public static createNeo4jData(): Promise<any> {
		// Create indices + constraints.
		let session = DatabaseManager.neo4jClient.session();
		let promises: Promise<void>[] = Object.keys(DatabaseManager.neo4jCollections).map((collection: any) => {
			collection = DatabaseManager.neo4jCollections[collection];
			let promises: Promise<any>[] = [];
			
			// Indices.
			(collection.indices || []).forEach((index: string) => {
				promises.push(session.run(`CREATE INDEX ON :${collection.name}(${index})`));
			});
			
			// Unique.
			(collection.uniqueness || []).forEach((uniqueness: string) => {
				promises.push(session.run(`CREATE CONSTRAINT ON (x:${collection.name}) ASSERT x.${uniqueness} IS UNIQUE`));
			});
			
			// Spatial.
			if(collection.spatial) promises.push(session.run(`CALL spatial.layers() YIELD name AS names WITH collect(names) AS layers WHERE NOT "${collection.name}" IN layers CALL spatial.addPointLayerXY('${collection.name}', '${collection.spatial.longitude}', '${collection.spatial.latitude}') YIELD node RETURN COUNT(*)`));
			
			// Fulltext.
			Object.keys(collection.fulltext || {}).forEach((key: string) => {
				let properties: any = {};
				properties[collection.name] = collection.fulltext[key];
				promises.push(session.run(`CALL apoc.index.addAllNodesExtended($indexName, $indexProperties, { autoUpdate: true })`, {
					indexName: key,
					indexProperties: properties
				}));
			});
			
			return Promise.all(promises).then(() => console.log(`Created indices for "${collection.name}" successfully.`)) as Promise<void>;
		});
		
		return Promise.all(promises).then(() => session.close());
	}
	
	public static disconnect(): void {
		Object.keys(DatabaseManager.onlineStatus).filter((key: string) => DatabaseManager.onlineStatus[key]).forEach(key => {
			switch (key) {
				case 'neo4j':
					DatabaseManager.neo4jClient.close();
					DatabaseManager.onlineStatus.neo4jClient = false;
					break;
				case 'redis':
					DatabaseManager.redisClient.quit();
					DatabaseManager.onlineStatus.redisClient = false;
					break;
			}
		});
	}
	
	public static connect(): Promise<void> {
		return new Promise<void>(resolve => {
			// Wait for neo4j.
            DatabaseManager.neo4jClient = Neo4j.driver(`bolt://${Config.backend.db.neo4j.host}:${Config.backend.db.neo4j.port}`, Neo4j.auth.basic(Config.backend.db.neo4j.user, Config.backend.db.neo4j.password));
            let session: Session = DatabaseManager.neo4jClient.session();
            let waitForNeo4jConnection = () => {
				session.run(
                        "MATCH (n) RETURN 'Number of Nodes: ' + COUNT(n) AS output UNION" +
                        " MATCH ()-[]->() RETURN 'Number of Relationships: ' + COUNT(*) AS output UNION" +
                        " CALL db.labels() YIELD label RETURN 'Number of Labels: ' + COUNT(*) AS output UNION" +
                        " CALL db.relationshipTypes() YIELD relationshipType RETURN 'Number of Relationships Types: ' + COUNT(*) AS output UNION" +
                        " CALL db.propertyKeys() YIELD propertyKey RETURN 'Number of Property Keys: ' + COUNT(*) AS output UNION" +
                        " CALL db.constraints() YIELD description RETURN 'Number of Constraints:' + COUNT(*) AS output UNION" +
                        " CALL db.indexes() YIELD description RETURN 'Number of Indexes: ' + COUNT(*) AS output UNION" +
                        " CALL dbms.procedures() YIELD name RETURN 'Number of Procedures: ' + COUNT(*) AS output"
                    ).then((result: any) => {
                        console.log('Connected to neo4j successfully...');
                        DatabaseManager.onlineStatus.neo4jClient = true;
                        DatabaseManager.neo4jFunctions.unflatten(result.records, 'output').forEach((summary: string) => console.log(summary));
                        session.close();
                    }).catch((error: any) => {
					// Retry.
					console.log(`Disconnected from neo4j...`);
					DatabaseManager.onlineStatus.neo4jClient = false;
					setTimeout(waitForNeo4jConnection, DatabaseManager.RETRY_MILLIS);
				});
			};
            waitForNeo4jConnection();
			
			// Connect to redis.
			DatabaseManager.redisClient = redis.createClient(Config.backend.db.redis.port, Config.backend.db.redis.host, {
				retry_strategy: () => {
					console.log(`Reconnect to redis in ${DatabaseManager.RETRY_MILLIS}ms...`);
					return DatabaseManager.RETRY_MILLIS;
				}
			});
			
			// Setup redis logging.
			DatabaseManager.redisClient.on('connect', () => {
				console.log('Connected to redis successfully...');
				DatabaseManager.onlineStatus.redisClient = true;
			});
			
			DatabaseManager.redisClient.on("end", () => {
				console.log('Connection to redis ended...');
				DatabaseManager.onlineStatus.redisClient = false;
			});
			
			let wait = setInterval(() => {
				if (_.values(DatabaseManager.onlineStatus).indexOf(false) < 0) {
					clearInterval(wait);
					resolve();
				}
			}, 1000);
		});
	}
}

export class TransactionSession {
	
	private transaction: Transaction = null;
	private session: Session = null;

	public beginTransaction(): Transaction {
		this.session = DatabaseManager.neo4jClient.session();
		this.transaction = this.session.beginTransaction();
		return this.transaction;
	}
	
	public finishTransaction<T>(promise: Promise<T>): Promise<T> {
		return promise.then((value: any) => {
			return this.transaction.commit().then(() => {
				this.session.close();
				return value;
			}, (err: any) => {
				this.session.close();
				console.log(err);
				return Promise.reject(err);
			});
		}, (err: any) => {
			return this.transaction.rollback().then(() => {
				this.session.close();
				return Promise.reject(err);
			}, (rollbackError: any) => {
				console.log(rollbackError);
				this.session.close();
				return Promise.reject(err);
			});
		});
	}
}
