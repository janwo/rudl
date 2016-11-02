import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {Router, NavigationEnd, UrlTree} from "@angular/router";
import { Subscription } from 'rxjs/Subscription';

@Component({
    template: require('./tab-menu.component.html'),
    styles: [require('./tab-menu.component.scss')],
    selector: 'tab-menu'
})
export class TabMenuComponent implements OnInit, OnDestroy {
    
    @Input() tabItems : { [key: string]: TabItem } = {};
    routerChanges : Subscription;
    activeTabItem: TabItem = null;
    
    constructor(
        private router: Router
    ) {}
    
    ngOnInit() {
        this.routerChanges = this.router.events.filter(value => value instanceof NavigationEnd).subscribe((route: NavigationEnd) => {
            this.activeTabItem = null;
            Object.keys(this.tabItems).map(key => this.tabItems[key]).forEach(( tabItem: TabItem ) => {
                if(!this.router.isActive(tabItem.link, false)) return true;
            
                this.activeTabItem = tabItem;
                tabItem.notification = false;
                return false;
            });
        });
    }
    
    ngOnDestroy(){
        this.routerChanges.unsubscribe();
    }
    
    private getIterable() {
        return Object.keys(this.tabItems).map(tabKey => this.tabItems[tabKey]);
    }
    
    private onClick(tabItem: TabItem) {
        if(!this.activeTabItem || this.activeTabItem.link.toString() !== tabItem.link.toString() ) this.router.navigateByUrl(tabItem.link);
    }
}

export interface TabItem {
    icon?: string,
    notification: boolean,
    title: string,
    link: UrlTree
}
