import * as ExtractTextPlugin from "extract-text-webpack-plugin";

export default {
	name: 'rudl - Test Environment',
	frontend: {
		webpack: {
			config: [
				( Config: any ) => {
					return {
						devtool: 'inline-source-map',
						module: {
							rules: [
								{
									test: /\.ts$/,
									use: [
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
