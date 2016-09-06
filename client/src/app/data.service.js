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
var DataService = (function () {
    function DataService(jsonp) {
        this.jsonp = jsonp;
    }
    DataService.prototype.get = function (url, headers) {
        if (headers === void 0) { headers = new http_1.Headers(); }
        return this.jsonp.get(DataService.domain + url, {
            headers: headers
        });
    };
    DataService.prototype.post = function (url, headers, body) {
        if (headers === void 0) { headers = new http_1.Headers(); }
        return this.jsonp.post(DataService.domain + url, body, {
            headers: headers
        });
    };
    DataService.prototype.delete = function (url, headers) {
        if (headers === void 0) { headers = new http_1.Headers(); }
        return this.jsonp.delete(DataService.domain + url, {
            headers: headers
        });
    };
    DataService.domain = 'http://localhost:8079';
    DataService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [http_1.Jsonp])
    ], DataService);
    return DataService;
}());
exports.DataService = DataService;
//# sourceMappingURL=data.service.js.map