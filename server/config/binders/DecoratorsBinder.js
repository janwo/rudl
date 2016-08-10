"use strict";
const glob = require("glob");
class DecoratorsBinder {
    static bind(server) {
        let decorators = [];
        glob.sync(`${__dirname}/../../app/decorators/**/*.js`).forEach(file => {
            decorators = decorators.concat(require(file).DecoratorsConfig);
        });
        decorators.forEach(decorator => {
            server.decorate(decorator.type, decorator.property, decorator.method);
        });
    }
}
exports.DecoratorsBinder = DecoratorsBinder;
//# sourceMappingURL=DecoratorsBinder.js.map