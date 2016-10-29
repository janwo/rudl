import {PluginsConfiguration} from "../binders/PluginsBinder";

export const PluginsConfig: PluginsConfiguration = [
	{register: require('inert')},
	{register: require('vision')}
];
