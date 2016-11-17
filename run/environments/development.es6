import ExtractTextPlugin from "extract-text-webpack-plugin";

export default {
	app: {
		title: 'eat-together - Development Environment'
	},
	frontend: {
		webpack: {
			devServer: {
				host: process.env.WEBPACK_SERVER_HOST || 'localhost',
				port: process.env.WEBPACK_SERVER_PORT || 8080,
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
						devtool: 'cheap-module-eval-source-map',
						entry: {
							'webpack-dev-server': `webpack-dev-server/client?${Config.backend.ssl.enabled ? 'https': 'http'}://localhost:${Config.frontend.webpack.devServer.port}/`,
						},
						plugins: [
							new ExtractTextPlugin( '[name].css' )
						]
					}
				}
			]
		},
	},
	backend: {
		host: process.env.BACKEND_SERVER_HOST || 'localhost',
		port: process.env.BACKEND_SERVER_PORT || 3000,
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
