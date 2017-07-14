import {Config} from '../../../run/config';
import {PluginsConfiguration} from '../binders/PluginsBinder';

export const PluginsConfig: PluginsConfiguration = [
	{
		register: require('henning'),
		options: {
			whitelist: Config.backend.uploadMimeTypes
		}
	}
];
