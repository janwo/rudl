"use strict";
const glob = require("glob");
class PluginsBinder {
    static bind(server) {
        return new Promise((resolve, reject) => {
            let plugins = [];
            glob.sync(`${__dirname}/../plugins/**/*.js`).forEach(file => {
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