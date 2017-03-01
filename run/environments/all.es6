import Webpack from "webpack";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import {root} from "../config";

export default {
	env: process.env.ENV,
	name: 'rudl - General Environment',
	debug: process.env.DEBUG_BACKEND || false,
	paths: {
		api: {
			publicPath: '/api'
		},
		public: {
			dir: root( '_generated/' ),
			filename: 'index.html',
			publicPath: '/',
			ignore404: true
		},
		avatars: {
			dir: root( 'db/files/avatars' ),
			publicPath: '/user-data/avatars/'
		}
	},
	frontend: {
		metadata: {
			'viewport': 'width=device-width, initial-scale=1.0',
			'mobile-web-app-capable': 'yes',
			'apple-mobile-web-app-title': 'Rudl',
			'apple-mobile-web-app-capable': 'yes',
			'apple-mobile-web-app-status-bar-style': '#50E3C2',
			'msapplication-navbutton-color': '#50E3C2',
			'theme-color': '#50E3C2'
		},
		messageTypes: {
			oauth: 'OAUTH_TOKEN_MESSAGE'
		},
		webpack: {
			config: [
				( Config ) => {
					return {
						devtool: 'source-map',
						resolve: {
							extensions: [ '.js', '.ts', '.scss', '.css' ],
							modules: [ 'node_modules' ],
						},
						entry: {
							'static/app': root( 'client/app.ts' ),
							'static/vendor': root( 'client/vendor.ts' ),
							'static/polyfill': root( 'client/polyfill.ts' )
						},
						module: {
							rules: [
								{
									test: /\.html$/,
									use: 'html-loader'
								},
								{
									test: /\.((png|jpe?g|gif|svg|woff2?|ttf|eot|ico)(\?v=\d*\.\d*\.\d*)?)$/,
									use: `file-loader?name=static/[name].[hash].[ext]`
								},
								{
									test: /manifest.json$/,
									loader: 'file-loader?name=[name].[hash].[ext]!web-app-manifest-loader'
								},
								{
									test: /\.scss$/,
									use: [
										'raw-loader', {
											loader: 'postcss-loader',
											options: {
												plugins: () => {
													return [
														require( 'autoprefixer' )( { browsers: [ 'last 2 versions' ] } )
													];
												}
											}
										}, 'sass-loader'
									]
								},
								{
									test: /\.css$/,
									exclude: root( 'client', 'app' ),
									use: ExtractTextPlugin.extract( {
										fallback: 'style-loader',
										use: 'css-loader'
									} )
								},
								{
									test: /\.css$/,
									include: root( 'client', 'app' ),
									use: 'css-loader'
								}
							]
						},
						output: {
							path: Config.paths.public.dir,
							filename: '[name].[hash].js',
							chunkFilename: '[id].[hash].chunk.js',
							publicPath: '/'
						},
						plugins: [
							new Webpack.DefinePlugin({
								'process.env': {
									ENV: JSON.stringify( Config.env ),
									DOMAIN: JSON.stringify( Config.backend.domain ),
									MESSAGE_TYPES: JSON.stringify( Config.frontend.messageTypes )
								}
							}),
							new HtmlWebpackPlugin({
								filename: Config.paths.public.filename,
								template: root('client/index.ejs'),
								title: Config.name,
								baseUrl: '/',
								metadata: Config.frontend.metadata
							}),
							new Webpack.optimize.CommonsChunkPlugin({
								name: [
									'static/app',
									'static/vendor',
									'static/polyfill'
								]
							})
						],
					}
				}
			]
		}
	},
	backend: {
		host: process.env.BACKEND_SERVER_HOST || 'localhost',
		port: process.env.BACKEND_SERVER_PORT || 80,
		domain: process.env.DOMAIN || 'http://localhost',
		ssl: false,
		secretPassphrase: process.env.SALT_PASSWORD,
		jwt: {
			expiresIn: 60 * 60 * 24 * 50,
			deleteIn: 60 * 60 * 24 * 30,
			salt: process.env.SALT_JWT
		},
		db: {
			redis: {
				host: process.env.REDIS_HOST || 'localhost',
				port: process.env.REDIS_PORT || 6379
			},
			arango: {
				host: process.env.ARANGO_HOST || 'localhost',
				port: process.env.ARANGO_PORT || 8529,
				database: process.env.ARANGO_DB || 'rudl',
				user: process.env.ARANGO_USER || 'rudl',
				password: process.env.ARANGO_PASSWORD || 'sgZ$LGKJhs_df872_3f$dxvhGR$REDsfd'
			}
		},
		maxUploadBytes: {
			avatars: 2097152
		},
		log: {
			serverLogs: {
				console: {
					enabled: false
				},
				file: {
					enabled: false,
					dirPath: process.env.LOGS_DIR || root('logs')
				}
			},
			databaseLogs: {
				redis: {
					enabled: false
				},
				arango: {
					enabled: false
				}
			}
		},
		providers: {
			facebook: {
				password: process.env.FACEBOOK_PASSWORD,
				clientID: process.env.FACEBOOK_ID,
				clientSecret: process.env.FACEBOOK_SECRET,
				callbackURL: '/oauth/facebook'
			},
			twitter: {
				password: 'oqbK@by0%#uoqbfdfby0%#uoqbK@by0%#u',
				clientID: process.env.TWITTER_ID || 'cVJWo8A0jf3WyG0ufbmDXVXwN',
				clientSecret: process.env.TWITTER_SECRET || 'vTyr3SLCUJU2EIEa3h9ZADZLh2ZUkomsmk1liSnG8649qnyIgo',
				callbackURL: '/oauth/twitter'
			},
			google: {
				password: process.env.GOOGLE_PASSWORD,
				clientID: process.env.GOOGLE_ID,
				clientSecret: process.env.GOOGLE_SECRET,
				callbackURL: '/oauth/google'
			}
		},
		mailer: {
			from: process.env.MAILER_FROM || 'MAILER_FROM',
			options: {
				service: process.env.MAILER_SERVICE_PROVIDER || 'MAILER_SERVICE_PROVIDER',
				auth: {
					user: process.env.MAILER_EMAIL_ID || 'MAILER_EMAIL_ID',
					pass: process.env.MAILER_PASSWORD || 'MAILER_PASSWORD'
				}
			}
		}
	}
};
