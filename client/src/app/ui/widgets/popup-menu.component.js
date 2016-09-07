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
var PopupMenuComponent = (function () {
    function PopupMenuComponent() {
        this.menuItems = [];
    }
    PopupMenuComponent.prototype.onClick = function (index) {
        var menuItem = this.menuItems[index];
        if (menuItem.click)
            menuItem.click.call();
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Array)
    ], PopupMenuComponent.prototype, "menuItems", void 0);
    PopupMenuComponent = __decorate([
        core_1.Component({
            template: require('./popup-menu.component.html'),
            styles: [require('./popup-menu.component.scss')],
            selector: 'popup-menu'
        }), 
        __metadata('design:paramtypes', [])
    ], PopupMenuComponent);
    return PopupMenuComponent;
}());
exports.PopupMenuComponent = PopupMenuComponent;
//# sourceMappingURL=popup-menu.component.js.map