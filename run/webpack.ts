import * as Webpack from "webpack";
import * as WebpackDevServer from "webpack-dev-server";
import {Config} from "./config";
import * as rimraf from "rimraf";

class WebpackManager {
	static clean() {
		return new Promise((resolve, reject) => {
			// Delete generated files.
			console.log('Delete public files...');
			rimraf(Config.paths.public.dir, (err: any) => {
				if(err) {
					reject(err);
					return;
				}
				
				console.log(`Successfully deleted public files...`);
				resolve();
			});
		});
	}
	
	static start(){
		// Create webpack compiler.
		const webpackCompiler = Webpack([Config.frontend.webpack.config]);
		
		// Listen on "done" to output stats.
		webpackCompiler.plugin('done', (stats: any) => {
			console.log('Webpack is done compiling...');
			if(Config.debug) console.log(stats.toString('minimal'));
		});
		
		// Listen on "error" to inject it into the console.
		webpackCompiler.plugin('failed', (err: any) => {
			console.error('An error occurred!');
			throw err;
		});
		
		// Run as webpack server.
		if ( Config.frontend.webpack.devServer ) {
			console.log( 'Starting webpack server...' );
			new WebpackDevServer( webpackCompiler, Config.frontend.webpack.devServer.config ).listen( Config.frontend.webpack.devServer.port, Config.frontend.webpack.devServer.host );
			return;
		}
		
		// Run standalone.
		if ( !Config.frontend.webpack.devServer ) {
			console.log( 'Starting webpack...' );
			webpackCompiler.run((err: any, stats: any) => {
				if(err) console.error(err);
			});
		}
	}
}

// Bring it up.
WebpackManager.start();
