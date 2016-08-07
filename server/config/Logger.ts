import {Config} from "./Config";

export function getLogReporters() {

    var reporters : any = [];

    // Console output.
    if(Config.log.serverLogs.options.filter) {
        reporters.push({
            module: 'good-squeeze',
            args: Config.log.serverLogs.options.filter
        });
    }
    reporters.push({
        module: 'good-console'
    });

    // File output.
    if(Config.log.serverLogs.options.file) {
        reporters.push({
            module: 'good-file',
            args: Config.log.serverLogs.options.file
        });
    }

    reporters.push('stdout');

    return reporters;
}
