import {PluginsConfiguration} from "../binders/PluginsBinder";

export var PluginsConfig: PluginsConfiguration = [
	{register: require('inert')},
	{register: require('vision')}
];
