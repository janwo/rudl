export const Config : {
	env: string,
	name: string,
	paths: { [key: string]: {
		dir?: string,
		filename?: string,
		publicPath?: string,
		ignore404?: boolean
	} },
	debug: boolean,
	frontend: {
		metadata: { [key: string]: string },
		messageTypes: { [key: string]: string },
		apiKeys: {
			mapzen: string
		},
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
		}
	},
	backend: {
		host: string,
		port: number,
		domain: string,
		icons: any,
		ssl: boolean,
		secretPassphrase: string,
		jwt: {
			expiresIn: number,
			deleteIn: number,
			salt: string,
		},
		maxUploadBytes: { [key: string]: number },
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
