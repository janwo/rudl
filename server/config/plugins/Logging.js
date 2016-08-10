"use strict";
const Config_1 = require("../Config");
exports.PluginsConfig = Config_1.Config.log.serverLogs.enabled ? [
    {
        register: require('good'),
        options: {
            reporters: {
                console: (() => {
                    var reporters = [];
                    // Console output.
                    reporters.push({
                        module: 'good-console'
                    });
                    if (Config_1.Config.log.serverLogs.options.filter) {
                        reporters.push({
                            module: 'good-squeeze',
                            args: Config_1.Config.log.serverLogs.options.filter
                        });
                    }
                    // File output.
                    if (Config_1.Config.log.serverLogs.options.file) {
                        reporters.push({
                            module: 'good-file',
                            args: Config_1.Config.log.serverLogs.options.file
                        });
                    }
                    reporters.push('stdout');
                    return reporters;
                })()
            }
        }
    }
] : [];
//# sourceMappingURL=Logging.js.map