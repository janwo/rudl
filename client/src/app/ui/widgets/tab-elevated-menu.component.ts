import {Component, OnInit} from "@angular/core";
import {Router, NavigationEnd} from "@angular/router";
import {TabMenuComponent} from "./tab-menu.component";

@Component({
    templateUrl: './tab-menu.component.html',
    styleUrls: ['./tab-elevated-menu.component.scss'],
    selector: 'tab-elevated-menu'
})
export class TabElevatedMenuComponent extends TabMenuComponent {
    constructor(router: Router) {
        super(router);
    }
}
