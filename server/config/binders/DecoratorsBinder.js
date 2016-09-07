"use strict";
const Glob = require("glob");
const Path = require('path');
class DecoratorsBinder {
    static bind(server) {
        let decorators = [];
        Glob.sync(Path.join(__dirname, `../../app/decorators/**/*.js`)).forEach(file => {
            decorators = decorators.concat(require(file).DecoratorsConfig);
        });
        decorators.forEach(decorator => {
            server.decorate(decorator.type, decorator.property, decorator.method);
        });
    }
}
exports.DecoratorsBinder = DecoratorsBinder;
//# sourceMappingURL=DecoratorsBinder.js.map