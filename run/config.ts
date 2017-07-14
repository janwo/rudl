import * as _ from 'lodash';
import * as Glob from 'glob';
import * as Path from 'path';
import * as webpackMerge from 'webpack-merge';
import * as util from 'util';
import * as Fs from 'fs';
import * as chalk from 'chalk';

/**
 * Helper function to resolve the root of the project.
 */
const _root = Path.resolve(__dirname, '..');
export function root(...args: any[]): string {
	return Path.resolve.apply(Path, [_root].concat(args));
}

/**
 * Resolve environment configuration by extending each env configuration file, and lastly
 * merge / override that with any local repository configuration that exists in local.js
 */
export const Config: {
	env: string,
	name: string,
	paths: {
		[key: string]: {
			dir?: string,
			filename?: string,
			publicPath?: string,
			ignore404?: boolean
		}
	},
	debug: boolean,
	frontend: {
		metadata: { [key: string]: string },
		messageTypes: { [key: string]: string },
		apiKeys: {
			mapzen: string
		},
		webpack: {
			config: {
				devtool: any,
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
			},
			devServer: {
				host: string,
				port: number,
				config: any
			}
		},
		
	},
	backend: {
		host: string,
		ports: {
			http: number,
			https: number,
			nodeDebug: number
		},
		domain: string,
		icons: any,
		mails: {
			noreply: string,
			admin: string
		},
		ssl: boolean,
		salts: {
			password: string
			random: string
			jwt: string
		},
		excludeRoutes: string[],
		jwt: {
			expiresIn: number,
			deleteIn: number
		},
		maxUploadBytes: { [key: string]: number },
		uploadMimeTypes: string[],
		log: {
			console: {
				enabled: boolean
			},
			file: {
				enabled: boolean,
				dirPath: string
			}
		},
		db: {
			redis: {
				host: string,
				port: number
			},
			neo4j: {
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
			google: {
				password: string,
				clientID: string,
				clientSecret: string,
				callbackURL: string
			}
		},
		ses: {
			accessKeyId: string,
			secretAccessKey: string,
			from: string,
			rateLimit?: number,
			region?: string,
			operational: boolean
		}
	}
} = (() => {
	// Check for environment variable.
	if (!process.env.ENV) {
		process.env.ENV = 'development';
		console.log(chalk.blue(`process.env.ENV is not defined! Set process.env.ENV to "${chalk.italic(process.env.ENV)}"...`));
	}
	
	// Does necessary environment files exist?
	if (Glob.sync(Path.resolve(__dirname, `./environments/${process.env.ENV}.ts`)).length == 0) return console.log(chalk.bold.red(`No configuration file found for "${chalk.italic(process.env.ENV)}" environment!`));
	
	// Merge all configs.
	let merged = _.mergeWith(
		require('./environments/all').default,
		require(`./environments/${process.env.ENV}`).default,
		(Fs.existsSync('./environments/local.ts') && require('./environments/local').default) || {},
		(objValue: any, srcValue: any, key: string) => {
			if (key == 'config' && _.isArray(objValue)) {
				return objValue.concat(srcValue);
			}
		}
	);
	
	// Post initialization of sub-config file: frontend.webpack.config.
	if (merged.frontend.webpack.config) {
		merged.frontend.webpack.config = merged.frontend.webpack.config.map((configFunction: any) => configFunction(merged));
		merged.frontend.webpack.config = webpackMerge.smart.apply(webpackMerge.smart, merged.frontend.webpack.config);
	}
	
	// Post initialization of sub-config file: frontend.webpack.devServer.config.
	if (merged.frontend.webpack.devServer) {
		merged.frontend.webpack.devServer.config = merged.frontend.webpack.devServer.config.map((configFunction: any) => configFunction(merged));
		merged.frontend.webpack.devServer.config = _.merge.apply(_.merge, [{}].concat(merged.frontend.webpack.devServer.config));
	}
	
	return merged;
})();

export function print(): void {
	// Create summary of the configuration file.
	console.log(chalk.yellow('\n- - - - - - - - - - - - - - - -'));
	console.log(chalk.yellow(`Summary of "${chalk.italic(Config.name)}":\n`));
	console.log(util.inspect(Config, {showHidden: false, depth: null, colors: true}));
	console.log(chalk.yellow('\n- - - - - - - - - - - - - - - -\n'));
}
