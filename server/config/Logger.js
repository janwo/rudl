"use strict";
const Config_1 = require("./Config");
function getLogReporters() {
    var reporters = [];
    // Console output.
    if (Config_1.Config.log.serverLogs.options.filter) {
        reporters.push({
            module: 'good-squeeze',
            args: Config_1.Config.log.serverLogs.options.filter
        });
    }
    reporters.push({
        module: 'good-console'
    });
    // File output.
    if (Config_1.Config.log.serverLogs.options.file) {
        reporters.push({
            module: 'good-file',
            args: Config_1.Config.log.serverLogs.options.file
        });
    }
    reporters.push('stdout');
    return reporters;
}
exports.getLogReporters = getLogReporters;
//# sourceMappingURL=Logger.js.map