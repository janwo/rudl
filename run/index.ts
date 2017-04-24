import * as forever from "forever-monitor";
import {Config, root} from './config';

let watch = (info: any) => {
	console.error(`Restaring script because ${info.file} changed...`);
};

let restart = () => {
	console.error('Forever restarting script...');
};

let exit = (code: number) => {
	console.error(`Forever detected script exited with code ${code}...`);
};

let webpack = new forever.Monitor(root('run/webpack.ts'), {
	command:  [
		'ts-node',
		`--project ${root('run')}`,
	].join(' '),
	max: 1
});
webpack.on('restart', restart);
webpack.on('watch:restart', watch);
webpack.on('exit:code', exit);
webpack.start();

let backendServer = new forever.Monitor(root('server/app/Hapi.ts'), {
	command: [
		'ts-node',
		`--project ${root('server')}`,
		Config.debug ? '--inspect=0.0.0.0:9229' : ''
	].join(' '),
	watch: Config.debug,
	watchDirectory: root('server'),
	max: 3
});
backendServer.on('restart', restart);
backendServer.on('watch:restart', watch);
backendServer.on('exit:code', exit);
backendServer.start();

// TODO Add startServer(webpack, backendServer);
