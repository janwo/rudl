import {Config} from "../Config";
import {PluginsConfiguration} from "../binders/PluginsBinder";

const whiteOutArgs = [{
    password: 'censor',
    age: 'censor'
}];

export var PluginsConfig:PluginsConfiguration = [{
    register: require('good'),
    options: {
        ops: {
            interval: 10000
        },
        reporters: (() => {
            let reporters:any = {};

            // Enable logging to console?
            if(Config.log.serverLogs.console) {
                reporters.console = [{
                    module: 'good-squeeze',
                    name: 'Squeeze',
                    args: [{
                        log: '*',
                        response: '*',
                        request: '*',
                        error: '*',
                        ops: '*'
                    }]
                }, {
                    module: 'good-console'
                }, {
                    module: 'white-out',
                    args: whiteOutArgs
                }, 'stdout'];
            }

            // Enable console to file?
            if (typeof Config.log.serverLogs.file) {
                reporters.file = [{
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
                    args: ['log', {
                        interval: '1d',
                        path: `${__dirname}/../../logs`
                    }]
                }];
            }

            return reporters;
        })()
    }
}];
