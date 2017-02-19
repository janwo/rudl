export const Config : {
	env: string,
	app: {
		title: string
	},
	generatedFiles: {
		frontendAssetsJson: string,
		frontendAssetsFolder: string
	},
	frontend: {
		webpack: {
			config: {
				devtool: string,
				resolve: {
					extensions: Array<string>,
					modules: Array<string>,
				},
				
				entry: Array<any>,
				
				module: {
					rules: Array<any>
				},
				
				output: {
					path: string,
					publicPath: string,
					filename: string,
					chunkFilename: string
				},
				
				plugins: Array<any>,
			}
		},
		themeColor: string
	},
	backend: {
		host: string,
		port: number,
		domain: string,
		debug: boolean,
		watchAssets: boolean,
		ssl: boolean,
		secretPassphrase: string,
		jwt: {
			expiresIn: number,
			deleteIn: number,
			salt: string,
		},
		uploads: {
			paths: {
				root: string;
				avatars: string;
			},
			maxUploadBytes: number,
		},
		log: {
			serverLogs: {
				console: {
					enabled: boolean
				},
				file: {
					enabled: boolean,
					dirPath: string
				}
			},
			databaseLogs: {
				redis: {
					enabled: boolean
				},
				arango: {
					enabled: boolean
				}
			}
		},
		db: {
			redis: {
				host: string,
				port: number
			},
			arango: {
				host: string,
				port: number,
				database: string,
				user: string,
				password: string
			}
		},
		providers: {
			facebook: {
				password: string,
				clientID: string,
				clientSecret: string,
				callbackURL: string
			},
			twitter: {
				password: string,
				clientID: string,
				clientSecret: string,
				callbackURL: string
			},
			google: {
				password: string,
				clientID: string,
				clientSecret: string,
				callbackURL: string
			}
		},
		mailer: {
			from: string,
			options: {
				service: string,
				auth: {
					user: string,
					pass: string
				}
			}
		}
	}
};

export function root( ...args : Array<string> ) : string;
export function print() : void;
