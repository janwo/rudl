import {Server} from "hapi";
import glob = require("glob");

export class DecoratorsBinder {

    public static bind (server : Server) : void {
        let decorators = [];
        glob.sync(`${__dirname}/../../app/decorators/**/*.js`).forEach(file => {
            decorators = decorators.concat(require(file).DecoratorsConfig);
        });

        decorators.forEach(decorator => {
            server.decorate(decorator.type, decorator.property, decorator.method);
        });
    }
}

export interface DecoratorsConfiguration extends Array<{
    type: string;
    property: string;
    method: Function;
}> {}
