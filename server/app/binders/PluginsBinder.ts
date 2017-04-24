import {Server} from "hapi";
import * as Glob from 'glob';
import * as Path from 'path';

export class PluginsBinder {
	
	public static bind(server: Server): Promise<any> {
		return new Promise((resolve, reject) => {
			let plugins: any[] = [];
			Glob.sync(Path.resolve(__dirname, `../plugins/**/*.ts`)).forEach(file => {
				plugins = plugins.concat(require(file).PluginsConfig);
			});
			
			server.register(plugins, (err: any) => {
				if (err) return reject(err);
				return resolve();
			});
		});
	}
}

export interface PluginsConfiguration extends Array<any> {
}
