import * as Webpack from "webpack";
import * as ExtractTextPlugin from "extract-text-webpack-plugin";
import {AotPlugin} from "@ngtools/webpack";
import {root} from "../config";

export default {
	name: 'rudl - Secure Production Environment',
	frontend: {
		webpack: {
			config: [
				( Config: any ) => {
					return {
						module: {
							rules: [
								{
									test: /\.ts$/,
									use: '@ngtools/webpack'
								}
							]
						},
						plugins: [
							new AotPlugin({
								tsConfigPath: root('client/tsconfig.json'),
								entryModule: root('client/app/app.module#AppModule')
							}),
							new Webpack.optimize.UglifyJsPlugin({
								compress: {
									warnings: false
								},
								comments: false,
								sourceMap: false
							}),
							new Webpack.NoEmitOnErrorsPlugin(),
							new ExtractTextPlugin( '[name].[hash].css' )
						]
					}
				}
			]
		}
	},
	backend: {
		host: process.env.BACKEND_SERVER_HOST || 'app',
		port: 443,
		domain: process.env.DOMAIN || 'https://localhost',
		db: {
			redis: {
				host: process.env.REDIS_HOST || 'redis'
			},
			arango: {
				host: process.env.ARANGO_HOST || 'arango'
			}
		},
		ssl: true,
		log: {
			serverLogs: {
				file: {
					enabled: true
				}
			}
		}
	}
}
