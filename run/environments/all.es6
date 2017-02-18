import Webpack from "webpack";
import Path from "path";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import AssetsPlugin from "assets-webpack-plugin";
import {root} from "../config";

export default {
	env: process.env.ENV,
	app: {
		title: 'eat-together - General Environment (WARNING: Have you checked your environment variables?)'
	},
	generatedFiles: (() => {
		let rootDir = '_generated/';
		return {
			frontendAssetsJson: root(rootDir, 'assets-manifest.json'),
			frontendAssetsFolder: root(rootDir, 'assets/')
		}
	})(),
	frontend: {
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
							'polyfill': root( 'client/polyfill.ts' ),
							'vendor': root( 'client/vendor.ts' ),
							'app': root( 'client/main.ts' )
						},
						module: {
							rules: [
								{
									test: /\.html$/,
									use: 'html-loader'
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
									test: /\.((woff2?|svg|ttf|eot|svg)(\?v=\d*\.\d*\.\d*))$/,
									use: 'file-loader?name=files/[name].[hash].[ext]'
								},
								{
									test: /\.(png|jpe?g|gif|svg|woff2?|ttf|eot|ico)$/,
									use: 'file-loader?name=files/[name].[hash].[ext]'
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
									use: 'raw-loader'
								}
							]
						},
						output: {
							path: Config.generatedFiles.frontendAssetsFolder,
							publicPath: '/static/assets/',
							filename: '[name].[hash].js',
							chunkFilename: '[id].[hash].chunk.js'
						},
						plugins: [
							new Webpack.DefinePlugin({
								'process.env': {
									'ENV': JSON.stringify( Config.env ),
									'DOMAIN': JSON.stringify( Config.backend.domain )
								}
							}),
							new AssetsPlugin({
								path: Path.dirname( Config.generatedFiles.frontendAssetsJson ),
								filename: Path.basename( Config.generatedFiles.frontendAssetsJson )
							})
						],
					}
				}
			]
		},
		themeColor: '#50E3C2'
	},
	backend: {
		host: process.env.BACKEND_SERVER_HOST || 'localhost',
		port: process.env.BACKEND_SERVER_PORT || 80,
		domain: process.env.DOMAIN || 'http://localhost',
		ssl: {
			enabled: false,
			certificatesDir: root('letsencrypt')
		},
		debug: process.env.DEBUG_BACKEND || false,
		watchAssets: true,
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
		uploads: {
			paths: {
				root: root( 'db/files' ),
				avatars: root( 'db/files/avatars' )
			},
			maxUploadBytes: 2097152
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
				clientID: process.env.GOOGLE_ID || '368340288629-nf8puh782soi68a3udusucbn1nh81sk2.apps.googleusercontent.com',
				clientSecret: process.env.GOOGLE_SECRET || '32pv9JsPuA3mNzYXiF4qevyy',
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
