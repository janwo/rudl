import {Component, Input, OnDestroy} from "@angular/core";
import {Router, NavigationEnd} from "@angular/router";
import { Subscription } from 'rxjs/Subscription';

@Component({
    template: require('./tab-menu.component.html'),
    styles: [require('./tab-menu.component.scss')],
    selector: 'tab-menu'
})
export class TabMenuComponent implements OnDestroy {
    
    @Input() tabItems : Array<TabItem> = [];
    routerChanges : Subscription;
    router: Router;
    activeTabItem: TabItem = null;
    
    ngOnDestroy(){
        this.routerChanges.unsubscribe();
    }
    
    onClick(tabItem: TabItem) {
        if(!this.activeTabItem || this.activeTabItem.link !== tabItem.link ) this.router.navigate([tabItem.link]);
    }
    
    constructor(router: Router) {
        this.router = router;
        this.routerChanges = router.events.filter(value => value instanceof NavigationEnd).subscribe((route: NavigationEnd) => {
            this.tabItems.every(( tabItem: TabItem ) => {
                if(tabItem.link !== route.urlAfterRedirects) return true;
    
                this.activeTabItem = tabItem;
                tabItem.notification = false;
                return false;
            });
        });
    }
}

export interface TabItem {
    icon: string,
    notification: boolean,
    title: string,
    link: string
}
