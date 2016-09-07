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
var TabMenuComponent = (function () {
    function TabMenuComponent() {
        this.tabItems = [];
        this.tabIndex = 0;
    }
    TabMenuComponent.prototype.setActiveTab = function (index) {
        this.tabIndex = index;
        var tabItem = this.tabItems[index];
        tabItem.notification = false;
        if (tabItem.click)
            tabItem.click.call();
    };
    TabMenuComponent.prototype.ngOnInit = function () {
        this.setActiveTab(this.tabIndex);
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Array)
    ], TabMenuComponent.prototype, "tabItems", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Number)
    ], TabMenuComponent.prototype, "tabIndex", void 0);
    TabMenuComponent = __decorate([
        core_1.Component({
            template: require('./tab-menu.component.html'),
            styles: [require('./tab-menu.component.scss')],
            selector: 'tab-menu'
        }), 
        __metadata('design:paramtypes', [])
    ], TabMenuComponent);
    return TabMenuComponent;
}());
exports.TabMenuComponent = TabMenuComponent;
//# sourceMappingURL=tab-menu.component.js.map