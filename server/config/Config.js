"use strict";
const _ = require('lodash');
const fs = require('fs');
/**
 * Resolve environment configuration by extending each env configuration file, and lastly
 * merge / override that with any local repository configuration that exists in local.js
 */
exports.Config = (function () {
    var conf = _.extend(require('./env/all'), require('./env/' + process.env.NODE_ENV) || {});
    return _.merge(conf, (fs.existsSync('./config/env/local.js') && require('./env/local.js')) || {});
}());
//# sourceMappingURL=Config.js.map