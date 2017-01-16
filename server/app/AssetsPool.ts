import {Config} from "../../run/config";
import * as Fs from 'fs';

export class AssetsPool {
	
	private static assets = null;
	
	public static getAssets() {
		if (!AssetsPool.assets) AssetsPool.updateAssets();
		return AssetsPool.assets;
	}
	
	public static updateAssets() {
		console.log(`Update assets in compliance with "${Config.generatedFiles.frontendAssetsJson}"-file...`);
		AssetsPool.assets = (() => {
			try {
				// Read assets.
				let entries = Config.frontend.webpack.config.entry;
				let assets = JSON.parse(Fs.readFileSync(Config.generatedFiles.frontendAssetsJson).toString());
				
				// Create types object.
				let types = {};
				for (let entry in entries) {
					for (let type in assets[entry]) {
						if (!types.hasOwnProperty(type)) types[type] = [];
						types[type].push(assets[entry][type]);
					}
				}
				return types;
			} catch (err) {
				console.error('An error occurred while regenerating assets...');
				console.error(err.message);
				return null;
			}
		})();
		console.log('Assets had been updated...');
	}
	
	public static watchAssets() {
		Fs.watch(Config.generatedFiles.frontendAssetsJson, {
			persistent: false
		}, eventType => {
			if (eventType != 'change') return;
			AssetsPool.updateAssets();
		});
	}
}
