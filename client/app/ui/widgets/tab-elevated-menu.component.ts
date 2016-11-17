import {Component, Input} from "@angular/core";
import {Router} from "@angular/router";
import {TabMenuComponent, TabItem} from "./tab-menu.component";

@Component({
    templateUrl: './tab-menu.component.html',
    styleUrls: ['./tab-elevated-menu.component.scss'],
    selector: 'tab-elevated-menu'
})
export class TabElevatedMenuComponent extends TabMenuComponent {
    
    @Input() tabItems : { [key: string]: TabItem } = {};
    
    constructor(router: Router) {
        super(router);
    }
}
