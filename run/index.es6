import Webpack from 'webpack';
import WebpackDevServer from "webpack-dev-server";
import {Config, print, root, AssetsPool} from "./config";
import * as forever from "forever";
import rimraf from "rimraf";
 
class StartupManager {
	
	static _backendServer = false;
	static _typescriptCompiler = false;
	
	static runTypescriptCompiler(watch = false) {
		return new Promise((resolve, reject) => {
			if(StartupManager._typescriptCompiler) return;
			
			let command = [
				'tsc -p server'
			].concat(watch ? [
				'-w'
			] : []);
			
			let options = {
				watch: false,
				max: 1,
				silent: true
			};
			
			let output = (string, err = false) => {
				string = `[tsc]: ${string}`;
				return err ? console.error(string) : console.log(string);
			};
			
			StartupManager._typescriptCompiler = new (forever.Monitor)(command, options);
			StartupManager._typescriptCompiler.on('start', () => output('Typescript has started...') );
			StartupManager._typescriptCompiler.on('exit', () => resolve(output('Typescript finished generating files...')) );
			StartupManager._typescriptCompiler.on('stdout', output );
			StartupManager._typescriptCompiler.on('error', reject);
			StartupManager._typescriptCompiler.start();
		});
	}
	
	static runServer(debug = false, watch = false){
		if(StartupManager._backendServer) return Promise.resolve();
		
		// Generate typescript files.
		return StartupManager.runTypescriptCompiler(false).then(() => {
			return new Promise((resolve, reject) => {
				let command = [
					'node',
					'run/backend-server.js'
				].concat(debug ? [
					'debug'
				] : []);
				
				let options = {
					watchDirectory: root('server'),
					watch: watch,
					max: 3,
					silent: true
				};
				
				let output = (string, err = false) => {
					string = `[backend-server]: ${string}`;
					return err ? console.error(string) : console.log(string);
				};
				
				// Trigger backend server.
				StartupManager._backendServer = new (forever.Monitor)(command, options);
				StartupManager._backendServer.on('start', info => output('Starting backend server...') );
				StartupManager._backendServer.on('watch:restart', info => output('Restaring script because ' + info.file + ' changed...') );
				StartupManager._backendServer.on('exit', () => resolve(output(`Backend server has exited after ${options.max} restarts...`, true)) );
				StartupManager._backendServer.on('stdout', output );
				StartupManager._backendServer.on('error', err => reject);
				StartupManager._backendServer.start();
			}).then(() => {
				// Watch typescript files.
				if(Config.backend.debug) return StartupManager.runTypescriptCompiler(true);
			});
		});
	}
	
	static clean() {
		// Delete generated files.
		console.log('Delete generated files...');
		for (let file in Config.generatedFiles) {
			if(Config.generatedFiles.hasOwnProperty(file)) {
				rimraf(Config.generatedFiles[file], {}, (err) => {
					if(err) return console.error(err);
					console.log(`${Config.generatedFiles[file]} successfully deleted...`);
				});
			}
		}
	}
	
	static start(){
		// Show generated config.
		print();
		
		// Clean generated files.
		StartupManager.clean();
		
		// Create webpack compiler.
		const webpackCompiler = Webpack(Config.frontend.webpack.config);
		
		// Listen on "done" to start backend server.
		webpackCompiler.plugin('done', (stats) => {
			// Output stats.
			console.log('Webpack is done compiling...');
			console.log(stats.toString('minimal'));
			
			StartupManager.runServer(Config.backend.debug, Config.backend.debug).catch(console.error);
		});
		
		// Listen on "error" to inject it into the console.
		webpackCompiler.plugin('failed', (err) => {
			console.error('An error occurred!');
			throw err;
		});
		
		// Run as webpack server.
		if ( Config.frontend.webpack.devServer ) {
			console.log( 'Starting webpack server...' );
			new WebpackDevServer( webpackCompiler, Config.frontend.webpack.devServer.config || {} ).listen( Config.frontend.webpack.devServer.port, Config.frontend.webpack.devServer.host );
			return;
		}
		
		// Run standalone.
		if ( !Config.frontend.webpack.devServer ) {
			console.log( 'Starting webpack...' );
			webpackCompiler.run();
		}
	}
}

StartupManager.start();
