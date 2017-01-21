import Webpack from 'webpack';
import WebpackDevServer from "webpack-dev-server";
import {Config, print, root} from "./config";
import * as forever from "forever";
import rimraf from "rimraf";
 
class StartupManager {
	
	static createTypescriptCompiler(watch = false, onExit = () => {}) {
		let command = [
			'tsc -p server -sourcemap'
		].concat(watch ? [
			'-w'
		] : []);
		
		let options = {
			watch: false,
			max: 1
		};
		
		let typescriptCompiler = new (forever.Monitor)(command, options);
		typescriptCompiler.on('start', () => console.log('Typescript has started...') );
		typescriptCompiler.on('exit', () => console.log('Typescript finished generating files...') || onExit());
		typescriptCompiler.on('error', err => console.error);
		return typescriptCompiler;
	}
	
	static createBackendServer(debug = false, onStart = () => {}){
		let command = [
			debug ? `npm run nodemon -- -e js --debug --watch ${root('server')}` : 'node',
			'run/backend-server.js'
		];
		
		let options = {
			watch: false,
			max: 3
		};
		
		// Trigger backend server.
		let backendServer = new (forever.Monitor)(command, options);
		backendServer.on('start', info => console.log('Starting backend server...') || onStart());
		backendServer.on('watch:restart', info => console.log('Restarting script because ' + info.file + ' changed...') );
		backendServer.on('exit', () => console.log(`Backend server has exited after ${options.max} restarts...`, true) );
		backendServer.on('error', err => console.error);
		return backendServer;
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
		
		// Create forever's monitor instances.
		let backendServerMonitor = StartupManager.createBackendServer(Config.backend.debug);
		let watchTypescriptMonitor = StartupManager.createTypescriptCompiler(Config.backend.debug);
		let typeScriptMonitor = StartupManager.createTypescriptCompiler(false, () => {
			backendServerMonitor.start();
			if(Config.backend.debug) watchTypescriptMonitor.start();
		} );
		
		// Create forever server.
		forever.startServer.apply(this, [
			backendServerMonitor,
			typeScriptMonitor,
			watchTypescriptMonitor
		]);
		
		// Create webpack compiler.
		const webpackCompiler = Webpack(Config.frontend.webpack.config);
		
		// Listen on "done" to start backend server.
		let typeScriptMonitorStarted = false;
		webpackCompiler.plugin('done', (stats) => {
			// Output stats.
			console.log('Webpack is done compiling...');
			console.log(stats.toString('minimal'));
			
			// Generate typescript files.
			if(!typeScriptMonitorStarted) {
				typeScriptMonitor.start();
				typeScriptMonitorStarted = true;
			}
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
			webpackCompiler.run((err, stats) => {});
		}
	}
}

StartupManager.start();