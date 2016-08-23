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
var InputFieldComponent = (function () {
    function InputFieldComponent() {
        this.description = null;
        this.type = null;
        this.placeholder = null;
    }
    InputFieldComponent.prototype.formatDescription = function () {
        if (this.description)
            return this.description.replace(/\*(.*)\*/, function () {
                var match = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    match[_i - 0] = arguments[_i];
                }
                return "<span class=\"emphasize\">" + match[1] + "</span>";
            });
        return null;
    };
    InputFieldComponent.inputAttributes = {
        type: 'mail',
        attributes: [
            {
                name: 'spellcheck',
                value: false
            },
            {
                name: 'autocomplete',
                value: 'off'
            },
            {
                name: 'type',
                value: 'text'
            }
        ]
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', String)
    ], InputFieldComponent.prototype, "description", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', String)
    ], InputFieldComponent.prototype, "type", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', String)
    ], InputFieldComponent.prototype, "placeholder", void 0);
    InputFieldComponent = __decorate([
        core_1.Component({
            template: require('./input-field.component.html'),
            styles: [require('./input-field.component.scss')],
            selector: 'input-field'
        }), 
        __metadata('design:paramtypes', [])
    ], InputFieldComponent);
    return InputFieldComponent;
}());
exports.InputFieldComponent = InputFieldComponent;
//# sourceMappingURL=input-field.component.js.map