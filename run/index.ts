import * as forever from "forever-monitor";
import {Config, root} from './config';

let watch = (info: any) => {
	console.warn(`Restaring script because ${info.file} changed...`);
};

let restart = () => {
	console.warn('Forever restarting script...');
};

let exit = (code: number) => {
	console.warn(`Forever detected script exited with code ${code}...`);
};

// Webpack.
let webpackCommands = [
	'ts-node',
	`--project ${root('run')}`,
];
let webpack = new forever.Monitor(root('run/webpack.ts'), {
	command: webpackCommands.join(' '),
	watch: false,
	max: 1
});
webpack.on('restart', restart);
webpack.on('watch:restart', watch);
webpack.on('exit:code', exit);
webpack.start();

// Backend server.
let backendServerCommands = [
	'ts-node',
	`--project ${root('server')}`
];
if(Config.debug) backendServerCommands.push(`--inspect=0.0.0.0:${Config.backend.ports.nodeDebug}`);
let backendServer = new forever.Monitor(root('server/app/Hapi.ts'), {
	command: backendServerCommands.join(' '),
	watch: Config.debug,
	watchDirectory: root('server'),
	max: 3
});
backendServer.on('restart', restart);
backendServer.on('watch:restart', watch);
backendServer.on('exit:code', exit);
backendServer.start();

// TODO Add startServer(webpack, backendServer);
