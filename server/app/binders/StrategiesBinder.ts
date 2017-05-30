import {Server} from 'hapi';
import * as Glob from 'glob';
import * as Path from 'path';

export class StrategiesBinder {
	
	public static bind(server: Server) {
		let defaultStrategiesFound: number = 0;
		Glob.sync(Path.resolve(__dirname, `../strategies/**/*.ts`)).forEach(file => {
			// Configure strategy.
			let config: any = require(file).StrategyConfig;
			server.auth.strategy(config.strategyName, config.schemeName, config.strategyConfig);
			
			// Set as default strategy?
			if (config.isDefault) {
				defaultStrategiesFound++;
				server.auth.default(config.strategyName);
			}
		});
		
		// Is there exact one default strategy defined?
		if (defaultStrategiesFound != 1) throw(new Error(`${defaultStrategiesFound} strategies found! Exact one strategy needs to be declared as default. Aborting startup...`));
	}
}

export interface StrategyConfiguration {
	isDefault: boolean;
	strategyName: string;
	schemeName: string;
	strategyConfig: any;
}
