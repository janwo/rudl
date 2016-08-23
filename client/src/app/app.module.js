"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var platform_browser_1 = require('@angular/platform-browser');
var app_component_1 = require('./app.component');
var login_component_1 = require("./ui/login.component");
var user_suggestions_component_1 = require("./ui/user-suggestions.component");
var landing_page_component_1 = require("./ui/landing-page.component");
var dashboard_component_1 = require("./ui/dashboard.component");
var button_component_1 = require("./ui/widgets/button.component");
var input_field_component_1 = require("./ui/input-field.component");
var AppModule = (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        core_1.NgModule({
            declarations: [
                app_component_1.AppComponent,
                login_component_1.LoginComponent,
                button_component_1.ButtonComponent,
                input_field_component_1.InputFieldComponent,
                landing_page_component_1.LandingPageComponent,
                dashboard_component_1.DashboardComponent,
                user_suggestions_component_1.UserSuggestionsComponent
            ],
            imports: [
                platform_browser_1.BrowserModule
            ],
            bootstrap: [
                app_component_1.AppComponent
            ],
        }), 
        __metadata('design:paramtypes', [])
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map