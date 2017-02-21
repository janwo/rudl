import _ from 'lodash';
import Glob from "glob";
import Path from "path";
import webpackMerge from "webpack-merge";
import * as util from "util";
import * as Fs from "fs";

/**
 * Helper function to resolve the root of the project.
 */
const _root = Path.resolve( __dirname, '..' );
export function root( ...args ) {
	return Path.resolve.apply( Path, [ _root ].concat( args ) );
}

/**
 * Resolve environment configuration by extending each env configuration file, and lastly
 * merge / override that with any local repository configuration that exists in local.js
 */
export const Config = (() => {
	// Check for environment variable.
	if (!process.env.ENV) {
		process.env.ENV = 'development';
		console.log(`process.env.ENV is not defined! Set process.env.ENV to "${process.env.ENV}"...`);
	}
	
	// Does necessary environment files exist?
	if (Glob.sync(Path.resolve(__dirname, `./environments/${process.env.ENV}.js`)).length == 0) return console.warn(`No configuration file found for "${process.env.ENV}" environment!`);
	
	// Merge all configs.
	console.log(`Generate config for "${process.env.ENV}" environment...`);
	let merged = _.mergeWith(
		require('./environments/all').default,
		require(`./environments/${process.env.ENV}`).default,
		(Fs.existsSync('./environments/local.js') && require('./environments/local.js').default) || {},
		(objValue, srcValue, key) => {
			if(key == 'config' && _.isArray(objValue)) {
				return objValue.concat(srcValue);
			}
		}
	);
	
	// Post initialization of sub-config file: frontend.webpack.config.
	if(merged.frontend.webpack.config) {
		merged.frontend.webpack.config = merged.frontend.webpack.config.map(configFunction => configFunction(merged));
		merged.frontend.webpack.config = webpackMerge.smart.apply(webpackMerge.smart, merged.frontend.webpack.config);
	}
	
	// Post initialization of sub-config file: frontend.webpack.devServer.config.
	if(merged.frontend.webpack.devServer) {
		merged.frontend.webpack.devServer.config = merged.frontend.webpack.devServer.config.map(configFunction => configFunction(merged));
		merged.frontend.webpack.devServer.config = _.merge.apply(_.merge, [{}].concat(merged.frontend.webpack.devServer.config));
	}
	
	return merged;
})();

export function print() {
	// Create summary of the configuration file.
	console.log('\n- - - - - - - - - - - - - - - -' );
	console.log(`Summary of "${Config.app.title}":\n\n${util.inspect(Config, {showHidden: false, depth: null, colors: true})}\n`);
	console.log('- - - - - - - - - - - - - - - -\n' );
}
