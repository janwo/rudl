import Webpack from "webpack";
import ExtractTextPlugin from "extract-text-webpack-plugin";

export default {
	app: {
		title: 'eat-together - Production Environment'
	},
	frontend: {
		webpack: {
			config: [
				( Config ) => {
					return {
						plugins: [
							new Webpack.optimize.UglifyJsPlugin(),
							new Webpack.NoErrorsPlugin(),
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
		log: {
			serverLogs: {
				file: {
					enabled: true
				}
			}
		}
	}
}
