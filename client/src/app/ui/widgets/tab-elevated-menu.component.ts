import {Component, OnInit} from "@angular/core";
import {Router, NavigationEnd} from "@angular/router";
import {TabMenuComponent} from "./tab-menu.component";

@Component({
    template: require('./tab-menu.component.html'),
    styles: [require('./tab-elevated-menu.component.scss')],
    selector: 'tab-elevated-menu'
})
export class TabElevatedMenuComponent extends TabMenuComponent {
    constructor(router: Router) {
        super(router);
    }
}
