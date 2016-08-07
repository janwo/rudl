import _ = require('lodash');
import fs = require('fs');

/**
 * Resolve environment configuration by extending each env configuration file, and lastly
 * merge / override that with any local repository configuration that exists in local.js
 */
export var Config = (function() {

  var conf = _.extend(
    require('./env/all'),
    require('./env/' + process.env.NODE_ENV) || {}
  );

  return _.merge(conf, (fs.existsSync('./config/env/local.js') && require('./env/local.js')) || {});
}());
