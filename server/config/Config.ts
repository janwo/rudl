import _ = require('lodash');
import Fs = require('fs');
import Glob = require("glob");
import Path = require("path");

/**
 * Resolve environment configuration by extending each env configuration file, and lastly
 * merge / override that with any local repository configuration that exists in local.js
 */
export var Config = (function() {
  // Test environment files.
  if (!Glob.sync(Path.join(__dirname, `environments/${process.env.NODE_ENV}.js`)).length) return console.warn(`No configuration file found for "${process.env.NODE_ENV}" environment!`);

  return _.merge(
      require('./environments/all'),
      require(Path.join(__dirname, `environments/${process.env.NODE_ENV}`)) || {},
      (Fs.existsSync('./config/environments/local.js') && require('./environments/local.js')) || {}
  );
}());

// Create summary of the configuration file.
(() => {
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
