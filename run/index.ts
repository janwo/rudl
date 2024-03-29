import * as forever from 'forever-monitor';
import * as chalk from 'chalk';
import {Config, root} from './config';

let watch = (info: any) => {
	console.log(chalk.bgCyan(`Restaring script because ${info.file} changed...`));
};

let restart = () => {
	console.log(chalk.bgCyan('Forever restarting script...'));
};

let exit = (code: number) => {
	console.log(chalk.bgMagenta(`Forever detected script exited with code ${code}...`));
};

// Webpack.
let webpackCommands = [
	'ts-node',
	`--project ${root('run')}`
];
if (!Config.debug) webpackCommands.push(`--fast`);
let webpack = new forever.Monitor(root('run/webpack.ts'), {
	command: webpackCommands.join(' '),
	watch: false,
	max: 1
});
webpack.on('restart', restart);
webpack.on('watch:restart', watch);
webpack.on('exit:code', exit);

// Backend server.
let backendCommands = [
	'ts-node',
	`--project ${root('server')}`
];
if (!Config.debug) backendCommands.push(`--fast`);
let backendCommand = backendCommands.join(' ');
if (Config.debug) backendCommand = `nodemon --ext ts,json --watch ${root('server')} --inspect=0.0.0.0:${Config.backend.ports.nodeDebug} --exec ${backendCommand}`;
let backendServer = new forever.Monitor(root('run/backend.ts'), {
	command: backendCommand,
	watch: false,
	max: 3
});
backendServer.on('restart', restart);
backendServer.on('watch:restart', watch);
backendServer.on('exit:code', exit);

// Backend tests.
let backendTestsCommands = [
	'mocha'
];

// Run backend tests.
let backendTestsCommand = backendTestsCommands.join(' ');
let backendTests = new forever.Monitor('test/index.ts', {
	command: backendTestsCommand,
	watch: false,
	max: 1
});

// Start tests instead?
if(Config.env == 'test') {
	backendTests.start();
	require("forever").startServer(backendTests);
} else {
	backendServer.start();
	webpack.start();
	require("forever").startServer(webpack, backendServer);
}
