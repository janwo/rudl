import {Component, Input, OnDestroy, style, animate, transition, trigger} from "@angular/core";
import {Router, NavigationEnd} from "@angular/router";
import { Subscription } from 'rxjs/Subscription';

@Component({
    template: require('./popup-menu.component.html'),
    styles: [require('./popup-menu.component.scss')],
    selector: 'popup-menu',
    animations: [
        trigger('openClose', [
            transition('void => opened', [
                style({
                    transform: 'translateY(-1rem)',
                    opacity: 0
                }),
                animate(100)
            ]),
            transition('opened => void', [
                animate(100, style({
                    transform: 'translateY(-1rem)',
                    opacity: 0
                }))
            ])
        ])
    ]
})
export class PopupMenuComponent implements OnDestroy {
    
    @Input() menuItems : Array<MenuItem> = [];
    animationState : string | boolean = false;
    routerChanges : Subscription;
    router: Router;
    activeMenuItem: MenuItem = null;
    
    ngOnDestroy(){
        this.routerChanges.unsubscribe();
    }
    
    toggle() : void {
        this.animationState = this.animationState ? false : 'opened';
    }
    
    onClick(menuItem: MenuItem) {
        if(menuItem.link) {
            if(this.activeMenuItem && this.activeMenuItem.link == menuItem.link) return;
            this.router.navigate([menuItem.link]);
        }
        if(menuItem.click) menuItem.click.call();
        this.animationState = false;
    }
    
    constructor(router: Router) {
        this.router = router;
        this.routerChanges = router.events.filter(value => value instanceof NavigationEnd).subscribe((route: NavigationEnd) => {
            this.activeMenuItem = null;
            this.menuItems.every(( menuItem: MenuItem ) => {
                if(menuItem.link !== route.urlAfterRedirects) return true;
                
                this.activeMenuItem = menuItem;
                menuItem.notification = false;
                return false;
            });
        });
    }
}

export interface MenuItem {
    icon: string,
    notification: boolean,
    title: string,
    link?: string,
    click?: any
}
