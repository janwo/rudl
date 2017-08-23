import * as Webpack from 'webpack';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import {root} from '../config';
import * as CleanObsoleteChunks from 'webpack-clean-obsolete-chunks';

export default {
	env: process.env.ENV,
	name: 'rudl - General Environment',
	debug: false,
	paths: {
		api: {
			publicPath: '/api/'
		},
		public: {
			dir: root('_generated'),
			filename: 'index.html',
			publicPath: '/',
			ignore404: true
		},
		avatars: {
			dir: root('db/files/avatars'),
			publicPath: '/user-data/avatars/'
		},
		icons: {
			dir: root('db/files/icons'),
			publicPath: '/static/icons/'
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
			'robots': 'follow,index',
			'description': 'Bei rudl einfach und entspannt die eigene Stadt kennenlernen, gleichgesinnte Menschen finden und die Freizeitgestaltung transparenter und einfach planbar gestalten.'
		},
		apiKeys: {
			mapzen: process.ENV.MAPZEN_KEY
		},
		webpack: {
			config: [
				(Config: any) => {
					return {
						devtool: 'source-map',
						resolve: {
							extensions: ['.js', '.ts', '.json'],
							modules: [
								root('client'), root('node_modules')
							]
						},
						entry: {
							'static/app': root('client/main.ts'),
							'static/vendor': root('client/vendor.ts'),
							'static/polyfill': root('client/polyfill.ts')
						},
						output: {
							path: Config.paths.public.dir,
							filename: '[name].[hash].js',
							chunkFilename: '[id].[hash].chunk.js',
							publicPath: '/'
						},
						module: {
							rules: [
								{
									test: /\.html$/,
									use: 'html-loader'
								}, {
									test: /\.((png|jpe?g|gif|svg|woff2?|ttf|eot|ico)(\?v=\d*\.\d*\.\d*)?)$/,
									use: `file-loader?name=static/[name].[hash].[ext]`
								}, {
									test: /manifest.json$/,
									loader: 'file-loader?name=[name].[hash].[ext]!web-app-manifest-loader'
								}, {
									test: /\.css$/,
									include: root('client', 'app'),
									use: [
										'to-string-loader', 'css-loader', {
											loader: 'postcss-loader',
											options: {
												sourceMap: true,
												plugins: () => {
                                                    return [
														require('autoprefixer')({browsers: ['last 2 versions']})
													];
												}
											}
										}
									]
								}, {
									test: /\.(scss)$/,
									include: root('client', 'app'),
									loaders: [
										'to-string-loader', 'css-loader', {
											loader: 'postcss-loader',
											options: {
												sourceMap: true,
												plugins: () => {
													return [
														require('autoprefixer')({browsers: ['last 2 versions']})
													];
												}
											}
										}, 'resolve-url-loader', 'sass-loader'
									]
								}, {
									test: /\.css$/,
									exclude: root('client', 'app'),
									use: ExtractTextPlugin.extract({
										fallback: 'style-loader',
										use: 'css-loader'
									})
								}
							]
						},
						plugins: [
							new Webpack.ContextReplacementPlugin(/angular(\\|\/)core(\\|\/)@angular/, root('src')),
							new Webpack.DefinePlugin({
								'process.env': {
									ENV: JSON.stringify(Config.env),
									DOMAIN: JSON.stringify(Config.backend.domain),
									JWT_TOKEN_NAME: JSON.stringify(Config.backend.jwt.name),
									API_KEYS: JSON.stringify(Config.frontend.apiKeys),
									MAX_UPLOAD_BYTES: JSON.stringify(Config.backend.maxUploadBytes),
									UPLOAD_MIME_TYPES: JSON.stringify(Config.backend.uploadMimeTypes)
								}
							}),
							new HtmlWebpackPlugin({
								filename: Config.paths.public.filename,
								template: root('client/index.ejs'),
								title: 'Entdecke den Puls deiner Stadt! | rudl.me'/*Config.name*/,
								baseUrl: '/',
                                domain: Config.backend.domain,
								metadata: Config.frontend.metadata
							}),
							new Webpack.optimize.CommonsChunkPlugin({
								names: [
									'static/app', 'static/vendor', 'static/polyfill'
								]
							}),
							new CleanObsoleteChunks()
						]
					};
				}
			]
		}
	},
	backend: {
		host: process.env.BACKEND_SERVER_HOST || 'app',
		domain: process.env.DOMAIN || 'http://localhost',
		ssl: false,
		ports: {
			http: process.env.BACKEND_SERVER_PORT_HTTP || 80,
			https: process.env.BACKEND_SERVER_PORT_HTTPS || 443,
			nodeDebug: process.env.BACKEND_SERVER_PORT_NODE_DEBUG || 9229,
			prometheusSummary: process.env.BACKEND_SERVER_PORT_PROMETHEUS_SUMMARY ||7788
		},
		icons: require('../../db/files/icons/data.json'),
		jwt: {
			name: 'jwt-token',
			expiresIn: 60 * 60 * 24 * 50,
			deleteIn: 60 * 60 * 24 * 30
		},
		salts: {
			jwt: process.env.SALT_JWT,
			random: process.env.SALT_RANDOM,
			password: process.env.SALT_PASSWORD
		},
		excludeRoutes: [],
		mails: {
			admin: 'we@rudl.me',
			noreply: 'noreply@rudl.me'
		},
		db: {
			redis: {
				host: process.env.REDIS_HOST || 'redis',
				port: process.env.REDIS_PORT || 6379
			},
			neo4j: {
				host: process.env.NEO4J_HOST || 'neo4j',
				port: process.env.NEO4J_PORT || 7687,
				database: process.env.NEO4J_DB || 'rudl',
				user: process.env.NEO4J_USER || 'rudl',
				password: process.env.NEO4J_PASSWORD || 'sgZ$LGKJhs_df872_3f$dxvhGR$REDsfd'
			}
		},
		maxUploadBytes: {
			avatars: 2097152
		},
		uploadMimeTypes: [
			'image/png',
			'image/jpeg',
			'image/webp',
			'image/gif'
		],
		log: {
			console: {
				enabled: false
			},
			file: {
				enabled: false,
				dirPath: process.env.LOGS_DIR || root('logs')
			}
		},
		providers: {
			facebook: {
				password: process.env.FACEBOOK_PASSWORD,
				clientID: process.env.FACEBOOK_ID,
				clientSecret: process.env.FACEBOOK_SECRET,
				callbackURL: '/oauth/facebook'
			},
			google: {
				password: process.env.GOOGLE_PASSWORD,
				clientID: process.env.GOOGLE_ID,
				clientSecret: process.env.GOOGLE_SECRET,
				callbackURL: '/oauth/google'
			}
		},
		ses: {
			accessKeyId: process.env.AWS_ID,
			secretAccessKey: process.env.AWS_SECRET,
			from: 'noreply@rudl.me',
			sendingRate: 14,
			region: 'eu-west-1',
			operational: false
		}
	}
};
