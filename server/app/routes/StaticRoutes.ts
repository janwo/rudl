import Path = require("path");
import {RoutesConfiguration} from "../../config/binders/RoutesBinder";

// Build assets once.
const staticAssets = ((entries, assets) => {
    let types = {};
    for( let entry in entries ){
        for(let type in assets[entry]) {
            if (!types.hasOwnProperty(type))
                types[type] = [];
            types[type].push(assets[entry][type]);
        }
    }
    console.log(types);
    return types;
})(require('../../../client/config/webpack.common').entry, require('../../../client/dist/webpack-assets'));

export var RoutesConfig : RoutesConfiguration = [{
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
