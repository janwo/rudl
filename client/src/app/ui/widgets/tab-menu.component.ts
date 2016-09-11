import {Component, Input, OnInit} from "@angular/core";

@Component({
    templateUrl: 'tab-menu.component.html',
    styleUrls: ['tab-menu.component.scss'],
    selector: 'tab-menu'
})
export class TabMenuComponent implements OnInit {
    
    @Input() tabItems : Array<{
        icon: string,
        notification: boolean,
        title: string,
        click?: any
    }> = [];
    @Input() tabIndex: number = 0;
    
    setActiveTab(index: number) {
        this.tabIndex = index;
        let tabItem = this.tabItems[index];
        tabItem.notification = false;
        if(tabItem.click) tabItem.click.call();
    }
    
    ngOnInit(){
        this.setActiveTab(this.tabIndex);
    }
    
    constructor() {
    }
}
