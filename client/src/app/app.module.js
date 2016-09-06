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
var core_1 = require("@angular/core");
var platform_browser_1 = require("@angular/platform-browser");
var app_component_1 = require("./app.component");
var login_component_1 = require("./ui/login.component");
var user_suggestions_component_1 = require("./ui/user-suggestions.component");
var landing_page_component_1 = require("./ui/landing-page.component");
var dashboard_component_1 = require("./ui/dashboard.component");
var styled_button_component_1 = require("./ui/widgets/styled-button.component");
var input_field_component_1 = require("./ui/input-field.component");
var auth_callback_component_1 = require("./ui/auth-callback.component");
var http_1 = require("@angular/http");
var app_guard_1 = require("./app.guard");
var data_service_1 = require("./data.service");
var app_routes_1 = require("./app.routes");
var forms_1 = require("@angular/forms");
var auth_service_1 = require("./auth.service");
var indicator_component_1 = require("./ui/widgets/indicator.component");
var AppModule = (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        core_1.NgModule({
            declarations: [
                app_component_1.AppComponent,
                login_component_1.LoginComponent,
                auth_callback_component_1.AuthCallbackComponent,
                styled_button_component_1.StyledButtonComponent,
                input_field_component_1.InputFieldComponent,
                landing_page_component_1.LandingPageComponent,
                indicator_component_1.IndicatorComponent,
                dashboard_component_1.DashboardComponent,
                user_suggestions_component_1.UserSuggestionsComponent
            ],
            providers: [
                auth_service_1.AuthService,
                data_service_1.DataService,
                app_guard_1.AppGuard,
                app_routes_1.appRoutingProviders
            ],
            imports: [
                forms_1.FormsModule,
                http_1.HttpModule,
                http_1.JsonpModule,
                platform_browser_1.BrowserModule,
                app_routes_1.routing
            ],
            bootstrap: [
                app_component_1.AppComponent
            ]
        }), 
        __metadata('design:paramtypes', [])
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map