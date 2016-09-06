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
var IndicatorComponent = (function () {
    function IndicatorComponent() {
        this.selectedIndex = 0;
    }
    IndicatorComponent.prototype.onClick = function (clickedIndex) {
        this.selectedIndex = clickedIndex;
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Array)
    ], IndicatorComponent.prototype, "indicators", void 0);
    IndicatorComponent = __decorate([
        core_1.Component({
            template: require('./indicator.component.html'),
            styles: [require('./indicator.component.scss')],
            selector: 'indicator'
        }), 
        __metadata('design:paramtypes', [])
    ], IndicatorComponent);
    return IndicatorComponent;
}());
exports.IndicatorComponent = IndicatorComponent;
//# sourceMappingURL=indicator.component.js.map