"use strict";
const Path = require("path");
// Build assets once.
const staticAssets = ((entries, assets) => {
    let types = {};
    for (let entry in entries) {
        for (let type in assets[entry]) {
            if (!types.hasOwnProperty(type))
                types[type] = [];
            types[type].push(assets[entry][type]);
        }
    }
    return types;
})(require('../../../client/config/webpack.common').entry, require('../../../client/dist/webpack-assets'));
exports.RoutesConfig = [{
        method: 'GET',
        path: '/assets/{path*}',
        handler: {
            directory: {
                path: Path.resolve('./../client/dist/assets'),
                listing: false,
                index: true
            }
        },
        config: {
            auth: false
        }
    }, {
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply.view('index', {
                title: 'Welcome',
                assets: staticAssets
            });
        },
        config: {
            auth: false
        }
    }];
//# sourceMappingURL=StaticRoutes.js.map