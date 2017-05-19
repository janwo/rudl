import {Config} from "../../../run/config";
import {PluginsConfiguration} from "../binders/PluginsBinder";

const whiteOutArgs = [
	{
		password: 'censor',
		age: 'censor'
	}
];

export const PluginsConfig: PluginsConfiguration = [
	{
		register: require('good'),
		options: {
			ops: {
				interval: 60000 * 15 // 15 Minutes
			},
			reporters: (() => {
				let reporters: any = {};
				
				// Enable logging to console?
				if (Config.backend.log.serverLogs.console.enabled) {
					reporters.console = [
						{
							module: 'good-squeeze',
							name: 'Squeeze',
							args: [
								{
									log: '*',
									response: '*',
									request: '*',
									error: '*',
									ops: '*'
								}
							]
						}, {
							module: 'good-console'
						}, {
							module: 'white-out',
							args: whiteOutArgs
						}, 'stdout'
					];
				}
				
				// Enable console to file?
				if (Config.backend.log.serverLogs.file.enabled) {
					reporters.file = [
						{
							module: 'good-squeeze',
							name: 'Squeeze',
							args: [{ops: '*'}]
						}, {
							module: 'white-out',
							args: whiteOutArgs
						}, {
							module: 'good-squeeze',
							name: 'SafeJson'
						}, {
							module: 'rotating-file-stream',
							args: [
								'log', {
									interval: '1d',
									path: Config.backend.log.serverLogs.file.dirPath
								}
							]
						}
					];
				}
				
				return reporters;
			})()
		}
	}
];
