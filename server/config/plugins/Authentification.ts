import {PluginsConfiguration} from "../binders/PluginsBinder";

export var PluginsConfig : PluginsConfiguration = [
    {register: require('bell')},
    {register: require('hapi-auth-jwt2')},
    {register: require('hapi-auth-basic')}
];
