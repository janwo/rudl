import {Config} from "../Config";
import {PluginsConfiguration} from "../binders/PluginsBinder";

export var PluginsConfig:PluginsConfiguration = Config.log.serverLogs.enabled ? [
    {
        register: require('good'),
        options: {
            reporters: {
                console: (() => {
                        var reporters : any = [];

                        // Console output.
                        reporters.push({
                            module: 'good-console'
                        });
                        if (Config.log.serverLogs.options.filter) {
                            reporters.push({
                                module: 'good-squeeze',
                                args: Config.log.serverLogs.options.filter
                            });
                        }

                        // File output.
                        if (Config.log.serverLogs.options.file) {
                            reporters.push({
                                module: 'good-file',
                                args: Config.log.serverLogs.options.file
                            });
                        }

                        reporters.push('stdout');
                        return reporters;
                    })()
            }
        }
    }
] : [];
