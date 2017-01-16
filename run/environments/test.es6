export default {
	app: {
		title: 'eat-together - Test Environment'
	},
	frontend: {
		webpack: {
			config: [
				( Config ) => {
					return {
						devtool: 'inline-source-map',
						module: {
							rules: [
								{
									test: /\.ts$/,
									loaders: [
										'awesome-typescript-loader?tsconfig=client/tsconfig.json',
										'angular2-template-loader'
									]
								}
							]
						},
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
				database: process.env.ARANGO_DB || 'rudl-test'
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
