import Webpack from "webpack";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import {AotPlugin} from '@ngtools/webpack';
import {root} from "../config";

export default {
	app: {
		title: 'eat-together - Secure Production Environment'
	},
	frontend: {
		webpack: {
			config: [
				( Config ) => {
					return {
						module: {
							rules: [
								{
									test: /\.ts$/,
									loader: '@ngtools/webpack'
								}
							]
						},
						plugins: [
							new AotPlugin({
								tsConfigPath: root('client/tsconfig.json'),
								entryModule: root('client/app/app.module#AppModule')
							}),
							new Webpack.NoErrorsPlugin(),
							new Webpack.optimize.UglifyJsPlugin({
								compress: {
									warnings: false
								},
								output: {
									comments: false
								},
								sourceMap: false
							}),
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
