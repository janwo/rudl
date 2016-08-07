(() => {
    // Set environment variable.
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development';
        console.log(`NODE_ENV is not defined! Set NODE_ENV to "${process.env.NODE_ENV}"...`);
    }
    console.log(`Server uses "${process.env.NODE_ENV}" environment...`);

    // Test environment files.
    if (!require("glob").sync('./config/env/' + process.env.NODE_ENV + '.js').length) return console.log('No configuration file found for "' + process.env.NODE_ENV + '" environment! Aborting startup...');

    // Create summary of the configuration file.
    (() => {
        let Config = require("./config/Config").Config;
        console.log('\n- - - - - - - - - - - - - - - -');
        console.log(`Summary of "${Config.app.title}":`);
        console.log(`Port:\t${Config.port}`);
        console.log(`HTTPS:\t${process.env.NODE_ENV === 'secure'}`);
        console.log(`Token:\tExpire in ${Config.jwt.expiresIn} seconds`);
        console.log(`Logging:\t${[
            `Server logs are ${Config.log.serverLogs.enabled ? 'enabled' : 'disabled'}`,
            `database logs are ${(function(){
                // Filter all active database names.
                var activeDatabases = Object.keys(Config.log.databaseLogs).filter(elem => {
                    return Config.log.databaseLogs[elem];
                }).join(', ');
    
                return activeDatabases ? `enabled for ${activeDatabases}` : 'disabled';
            }())}`
        ].join(', ')}`);
        console.log(`Databases:\t${Object.keys(Config.db).map(elem => {
            // Get host and port data of all databases.
            return `${elem} (host: ${Config.db[elem].host}, port: ${Config.db[elem].port})`;
        }).join(', ')}`);
        console.log('- - - - - - - - - - - - - - - -\n');
    })();

    // Start Hapi server.
    require("./config/Hapi").hapiServer();
})();
