"use strict";
const Glob = require("glob");
const Path = require('path');
class PluginsBinder {
    static bind(server) {
        return new Promise((resolve, reject) => {
            let plugins = [];
            Glob.sync(Path.join(__dirname, `../plugins/**/*.js`)).forEach(file => {
                plugins = plugins.concat(require(file).PluginsConfig);
            });
            server.register(plugins, (err) => {
                if (err)
                    return reject(err);
                return resolve();
            });
        });
    }
}
exports.PluginsBinder = PluginsBinder;
//# sourceMappingURL=PluginsBinder.js.map