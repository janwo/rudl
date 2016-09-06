"use strict";
var router_1 = require("@angular/router");
var landing_page_component_1 = require("./ui/landing-page.component");
var dashboard_component_1 = require("./ui/dashboard.component");
var app_guard_1 = require("./app.guard");
var auth_callback_component_1 = require("./ui/auth-callback.component");
var appRoutes = [
    { path: '', component: landing_page_component_1.LandingPageComponent },
    { path: 'home', component: dashboard_component_1.DashboardComponent, canActivate: [app_guard_1.AppGuard] },
    { path: 'oauth/:strategy', component: auth_callback_component_1.AuthCallbackComponent }
];
exports.appRoutingProviders = [];
exports.routing = router_1.RouterModule.forRoot(appRoutes);
//# sourceMappingURL=app.routes.js.map