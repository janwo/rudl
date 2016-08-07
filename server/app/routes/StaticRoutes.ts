import Path = require("path");

export var RouteConfig = [{
    method: 'GET',
    path: '/{path*}',
    config: {
        handler: {
            directory: {
                path: Path.resolve('./../client/dist'),
                listing: false,
                index: true
            }
        },
        auth: false
    }
}];
