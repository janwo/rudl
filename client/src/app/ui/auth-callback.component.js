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
var data_service_1 = require("../data.service");
var auth_service_1 = require("../auth.service");
var AuthCallbackComponent = (function () {
    function AuthCallbackComponent() {
        var metaElement = document.querySelector('meta[name="token"]');
        var token = metaElement.getAttribute('content');
        window.opener.postMessage({
            type: auth_service_1.AuthService.callbackMessageType,
            message: {
                token: token
            }
        }, data_service_1.DataService.domain);
        console.log('test');
        window.close();
    }
    AuthCallbackComponent = __decorate([
        core_1.Component({
            template: require('./auth-callback.component.html'),
            styles: [require('./auth-callback.component.scss')]
        }), 
        __metadata('design:paramtypes', [])
    ], AuthCallbackComponent);
    return AuthCallbackComponent;
}());
exports.AuthCallbackComponent = AuthCallbackComponent;
//# sourceMappingURL=auth-callback.component.js.map