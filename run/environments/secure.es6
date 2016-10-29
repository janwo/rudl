import Webpack from "webpack";
import ExtractTextPlugin from "extract-text-webpack-plugin";

export default {
	app: {
		title: 'eat-together - Secure Production Environment'
	},
	frontend: {
		webpack: {
			config: [
				( Config ) => {
					return {
						plugins: [
							new Webpack.NoErrorsPlugin(),
							new Webpack.optimize.DedupePlugin(),
							new Webpack.optimize.UglifyJsPlugin(),
							new ExtractTextPlugin( '[name].[hash].css' )
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
				host: process.env.ARANGO_HOST || 'arango'
			}
		},
		ssl: {
			enabled: true
		},
		log: {
			serverLogs: {
				file: {
					enabled: true
				}
			}
		}
	}
};
