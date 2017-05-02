import * as Webpack from "webpack";
import * as WebpackDevServer from "webpack-dev-server";
import {Config} from "./config";
import * as rimraf from "rimraf";
import * as chalk from "chalk";

class WebpackManager {
	static clean() {
		return new Promise((resolve, reject) => {
			// Delete generated files.
			console.log(chalk.yellow('Delete public files...'));
			rimraf(Config.paths.public.dir, (err: any) => {
				if(err) {
					reject(err);
					return;
				}
				
				console.log(chalk.bold.green(`Successfully deleted public files...`));
				resolve();
			});
		});
	}
	
	static start(){
		// Create webpack compiler.
		const webpackCompiler = Webpack([Config.frontend.webpack.config]);
		
		// Listen on "done" to output stats.
		webpackCompiler.plugin('done', (stats: any) => {
			let colorize = stats.hasErrors() ? chalk.bold.red : chalk.green;
			console.log(colorize('Webpack is done compiling...'));
			
			// Show
			if(Config.debug && !stats.hasErrors()) {
				console.log(stats.toString({
					chunks: false,
					modules: false,
					children: false,
					colors: true,
					assets: true,
					assetsSort: "field",
					cached: true,
					chunkModules: false,
					chunkOrigins: true,
					chunksSort: "field",
					errors: true,
					errorDetails: true,
					hash: true,
					timings: true,
					version: true
				}));
			} else if(stats.hasErrors()) {
				stats.toJson().errors.forEach((error: string) => console.log(colorize(error)));
			}
		});
		
		// Listen on "error" to inject it into the console.
		webpackCompiler.plugin('failed', (err: any) => {
			console.log(chalk.red('An error occurred!'));
			throw err;
		});
		
		// Run as webpack server.
		if ( Config.frontend.webpack.devServer ) {
			console.log(chalk.yellow('Starting webpack server...'));
			new WebpackDevServer( webpackCompiler, Config.frontend.webpack.devServer.config ).listen( Config.frontend.webpack.devServer.port, Config.frontend.webpack.devServer.host );
			return;
		}
		
		// Run standalone.
		if ( !Config.frontend.webpack.devServer ) {
			console.log(chalk.yellow('Starting webpack...'));
			webpackCompiler.run((err: any, stats: any) => {});
		}
	}
}

// Bring it up.
WebpackManager.clean().then(() => WebpackManager.start());
