import {Component, OnInit} from "@angular/core";
import {Router, NavigationEnd} from "@angular/router";
import {TabMenuComponent} from "./tab-menu.component";

@Component({
    template: require('./tab-menu.component.html'),
    styles: [require('./elevated-tab-menu.component.scss')],
    selector: 'elevated-tab-menu'
})
export class ElevatedTabMenuComponent extends TabMenuComponent {
    constructor(router: Router) {
        super(router);
    }
}
