export default {
	app: {
		title: 'eat-together - Test Environment'
	},
	frontend: {
		webpack: {
			config: [
				( Config ) => {
					return {
						devtool: 'cheap-module-eval-source-map',
						debug: true,
						plugins: [
							new ExtractTextPlugin( '[name].css' )
						]
					}
				}
			]
		}
	},
	backend: {
		host: process.env.BACKEND_SERVER_HOST || 'app',
		db: {
			redis: {
				host: process.env.REDIS_HOST || 'redis'
			},
			arango: {
				host: process.env.ARANGO_HOST || 'arango',
				database: process.env.ARANGO_DB || 'meal2share-test'
			}
		},
		log: {
			serverLogs: {
				console: {
					enabled: true
				}
			},
			databaseLogs: {
				redis: {
					enabled: true
				},
				arango: {
					enabled: true
				}
			}
		}
	}
};
