import ExtractTextPlugin from "extract-text-webpack-plugin";
import {AotPlugin} from '@ngtools/webpack';
import {root} from "../config";
import Webpack from "webpack";

export default {
	app: {
		title: 'eat-together - Development Environment'
	},
	frontend: {
		webpack: {
			devServer: {
				host: process.env.WEBPACK_SERVER_HOST || 'app',
				port: process.env.WEBPACK_SERVER_PORT || 80,
				config: [
					( Config ) => {
						return {
							inline: true,
							stats: false,
							historyApiFallback: true,
							publicPath: '/static/assets/',
							proxy: {
								'**': {
									target: {
										host: Config.backend.host,
										port: Config.backend.port
									},
									secure: Config.backend.ssl.enabled,
									bypass: req => /^\/static\/assets\/.*$/.test(req.url) ? req.url : false
								}
							}
						}
					}
				]
			},
			config: [
				( Config ) => {
					return {
						devtool: 'inline-source-map',
						entry: {
							'webpack-dev-server': `webpack-dev-server/client?${Config.backend.ssl.enabled ? 'https': 'http'}://localhost:${Config.frontend.webpack.devServer.port}/`,
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
							new ExtractTextPlugin( '[name].css' ),
							new Webpack.ContextReplacementPlugin( /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/, root('client/') )
						]
					}
				}
			]
		}
	},
	backend: {
		host: process.env.BACKEND_SERVER_HOST || 'app',
		port: process.env.BACKEND_SERVER_PORT || 8080,
		debug: true,
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
