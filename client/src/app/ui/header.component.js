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
var HeaderComponent = (function () {
    function HeaderComponent() {
        this.tabItems = [
            {
                icon: 'bell-o',
                title: 'Verlauf',
                notification: true,
                click: function () { console.log('bell-o'); }
            },
            {
                icon: 'compass',
                title: 'Entdecken',
                notification: false,
                click: function () { console.log('compass'); }
            },
            {
                icon: 'users',
                title: 'Freunde',
                notification: false,
                click: function () { console.log('users'); }
            }
        ];
        this.menuItems = [
            {
                icon: 'user-md',
                title: 'Profil',
                click: function () { console.log('user-md'); }
            },
            {
                icon: 'cog',
                title: 'Einstellungen',
                click: function () { console.log('cog'); }
            },
            {
                icon: 'sign-out',
                title: 'Abmelden',
                click: function () { console.log('sign-out'); }
            }
        ];
        this.popupMenuIsVisible = true;
    }
    HeaderComponent.prototype.togglePopupMenu = function () {
        this.popupMenuIsVisible = !this.popupMenuIsVisible;
    };
    HeaderComponent = __decorate([
        core_1.Component({
            template: require('./header.component.html'),
            styles: [require('./header.component.scss')],
            selector: 'header'
        }), 
        __metadata('design:paramtypes', [])
    ], HeaderComponent);
    return HeaderComponent;
}());
exports.HeaderComponent = HeaderComponent;
//# sourceMappingURL=header.component.js.map