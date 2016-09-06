"use strict";
var platform_browser_dynamic_1 = require("@angular/platform-browser-dynamic");
var app_module_1 = require("./app/app.module");
var WebFont = require("webfontloader");
// Initialize Angular.
platform_browser_dynamic_1.platformBrowserDynamic().bootstrapModule(app_module_1.AppModule);
// Load Fonts.
WebFont.load({
    google: {
        families: ['Lato:400,700']
    }
});
//# sourceMappingURL=main.js.map