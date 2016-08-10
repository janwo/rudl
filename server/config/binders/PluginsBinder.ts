import {Server} from "hapi";
import glob = require("glob");

export class PluginsBinder {

    public static bind (server : Server) : Promise<any> {
        return new Promise((resolve, reject) => {
            let plugins = [];
            glob.sync(`${__dirname}/../plugins/**/*.js`).forEach(file => {
                plugins = plugins.concat(require(file).PluginsConfig);
            });

            server.register(plugins, (err) => {
                if (err) return reject(err);
                return resolve();
            });
        });
    }
}

export interface PluginsConfiguration extends Array<any> {}
