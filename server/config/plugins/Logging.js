"use strict";
const Config_1 = require("../Config");
const Path = require('path');
const whiteOutArgs = [
    {
        password: 'censor',
        age: 'censor'
    }
];
exports.PluginsConfig = [
    {
        register: require('good'),
        options: {
            ops: {
                interval: 10000
            },
            reporters: (() => {
                let reporters = {};
                // Enable logging to console?
                if (Config_1.Config.log.serverLogs.console) {
                    reporters.console = [
                        {
                            module: 'good-squeeze',
                            name: 'Squeeze',
                            args: [
                                {
                                    log: '*',
                                    response: '*',
                                    request: '*',
                                    error: '*',
                                    ops: '*'
                                }
                            ]
                        }, {
                            module: 'good-console'
                        }, {
                            module: 'white-out',
                            args: whiteOutArgs
                        }, 'stdout'
                    ];
                }
                // Enable console to file?
                if (typeof Config_1.Config.log.serverLogs.file) {
                    reporters.file = [
                        {
                            module: 'good-squeeze',
                            name: 'Squeeze',
                            args: [{ ops: '*' }]
                        }, {
                            module: 'white-out',
                            args: whiteOutArgs
                        }, {
                            module: 'good-squeeze',
                            name: 'SafeJson'
                        }, {
                            module: 'rotating-file-stream',
                            args: [
                                'log', {
                                    interval: '1d',
                                    path: Path.join(__dirname, '../../logs')
                                }
                            ]
                        }
                    ];
                }
                return reporters;
            })()
        }
    }
];
//# sourceMappingURL=Logging.js.map