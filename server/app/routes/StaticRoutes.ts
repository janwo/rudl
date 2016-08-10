import Path = require("path");
import {RoutesConfiguration} from "../../config/binders/RoutesBinder";

export var RoutesConfig : RoutesConfiguration = [{
    method: 'GET',
    path: '/{path*}',
    handler: {
        directory: {
            path: Path.resolve('./../client/dist'),
            listing: false,
            index: true
        }
    },
    config: {
        auth: false
    }
}];
