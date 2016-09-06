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
var http_1 = require("@angular/http");
var router_1 = require("@angular/router");
var data_service_1 = require("./data.service");
var AuthService = (function () {
    function AuthService(dataService, router) {
        this.token = false;
        this.dataService = dataService;
        this.router = router;
        this.token = localStorage.getItem(AuthService.localStorageKey) || false;
        // Listen to any incoming authentication messages.
        this.registerAuthenticationMessageListener();
    }
    AuthService.prototype.createAuthorizationHeader = function () {
        var headers = new http_1.Headers();
        headers.append('Authorization', "Bearer " + this.getToken());
        return headers;
    };
    AuthService.prototype.setToken = function (token) {
        this.token = token;
        localStorage.setItem(AuthService.localStorageKey, token);
    };
    AuthService.prototype.getToken = function () {
        return this.token;
    };
    AuthService.prototype.removeToken = function () {
        this.token = false;
        localStorage.removeItem(AuthService.localStorageKey);
    };
    AuthService.prototype.redirectToDashboard = function () {
        this.router.navigateByUrl('home');
    };
    AuthService.prototype.signUp = function (username, password) {
    };
    AuthService.prototype.signIn = function (username, password) {
    };
    AuthService.prototype.registerAuthenticationMessageListener = function () {
        var _this = this;
        window.addEventListener('message', function (event) {
            if (event.origin != data_service_1.DataService.domain || event.data.type !== AuthService.callbackMessageType)
                return;
            _this.setToken(event.data.message.token);
            console.group('Window message received');
            console.log(event.data.message.token);
            console.groupEnd();
            _this.redirectToDashboard();
        }, false);
    };
    AuthService.prototype.me = function () {
        return this.dataService.get('/api/users/me', this.createAuthorizationHeader());
    };
    AuthService.callbackMessageType = 'AUTH_CALLBACK_MESSAGE';
    AuthService.localStorageKey = 'jwt-token';
    AuthService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [data_service_1.DataService, router_1.Router])
    ], AuthService);
    return AuthService;
}());
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map