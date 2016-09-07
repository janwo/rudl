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
var auth_service_1 = require("../auth.service");
var indicator_component_1 = require("./widgets/indicator.component");
var LoginComponent = (function () {
    function LoginComponent(authService) {
        this.isCollapsed = true;
        this.signInOnly = false;
        this.authService = authService;
    }
    LoginComponent.prototype.onToggleMethod = function () {
        // Unfold, if not done already.
        if (this.isCollapsed)
            this.isCollapsed = false;
        // Toggle method.
        this.signInOnly = !this.signInOnly;
        // Reset selected index of the indicator.
        this.indicatorComponent.selectedIndex = 0;
    };
    LoginComponent.prototype.onClickMailButton = function () {
        // Increase indicator on click.
        if (!this.isCollapsed && this.indicatorComponent.selectedIndex == 0)
            this.indicatorComponent.selectedIndex++;
        // Unfold, if not done already.
        if (this.isCollapsed)
            this.isCollapsed = false;
        // Try to register user.
        this.authService.signUp('user', 'pwd');
    };
    __decorate([
        core_1.ViewChild(indicator_component_1.IndicatorComponent), 
        __metadata('design:type', indicator_component_1.IndicatorComponent)
    ], LoginComponent.prototype, "indicatorComponent", void 0);
    LoginComponent = __decorate([
        core_1.Component({
            template: require('./login.component.html'),
            styles: [require('./login.component.scss')],
            selector: 'login'
        }), 
        __metadata('design:paramtypes', [auth_service_1.AuthService])
    ], LoginComponent);
    return LoginComponent;
}());
exports.LoginComponent = LoginComponent;
//# sourceMappingURL=login.component.js.map