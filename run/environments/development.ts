import * as ExtractTextPlugin from "extract-text-webpack-plugin";
import {root} from "../config";

export default {
	name: 'rudl - Development Environment',
	debug: true,
	frontend: {
		webpack: {
			devServer: {
				host: 'app',
				port: 80,
				config: [
					( Config: any ) => {
						return {
							inline: true,
							contentBase: root('client'),
							historyApiFallback: true,
							proxy: [{
								context: [
									Config.paths.api.publicPath,
									Config.paths.avatars.publicPath,
									Config.paths.icons.publicPath,
									Config.backend.providers.facebook.callbackURL,
									Config.backend.providers.twitter.callbackURL,
									Config.backend.providers.google.callbackURL
								],
								target: {
									host: Config.backend.host,
									port: Config.backend.ports.http
								}
							}],
							watchOptions: {
								aggregateTimeout: 300,
								poll: 1000
							}
						}
					}
				]
			},
			config: [
				( Config: any ) => {
					return {
						devtool: 'inline-source-map',
						entry: {
							'webpack-dev-server': `webpack-dev-server/client?http://localhost:${Config.frontend.webpack.devServer.port}/`,
						},
						module: {
							rules: [
								{
									test: /\.ts$/,
									use: [
										`awesome-typescript-loader?configFileName=${root('client/tsconfig.json')}`,
										'angular2-template-loader'
									]
								}
							]
						},
						plugins: [
							new ExtractTextPlugin( '[name].[hash].css' )
						]
					}
				}
			]
		}
	},
	backend: {
		ports: {
			http: 8080,
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
