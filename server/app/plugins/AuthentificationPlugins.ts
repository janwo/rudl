import {PluginsConfiguration} from '../binders/PluginsBinder';

export const PluginsConfig: PluginsConfiguration = [
	{register: require('bell')},
	{register: require('hapi-auth-jwt2')}
];
