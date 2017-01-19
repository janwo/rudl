import {Component, Input, OnDestroy, style, animate, transition, trigger, OnInit} from "@angular/core";
import {Router, NavigationEnd, UrlTree} from "@angular/router";
import { Subscription } from 'rxjs/Subscription';

@Component({
    templateUrl: './dropdown-menu.component.html',
    styleUrls: ['./dropdown-menu.component.scss'],
    selector: 'dropdown-menu',
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
export class DropdownMenuComponent implements OnDestroy, OnInit {
    
    @Input() menuItems : Array<MenuItem> = [];
    animationState : string | boolean = false;
    routerChanges : Subscription;
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
            this.router.navigateByUrl(menuItem.link);
        }
        
        if(menuItem.click) menuItem.click.call();
    }
    
    ngOnInit() {
        this.routerChanges = this.router.events.filter(value => value instanceof NavigationEnd).subscribe((route: NavigationEnd) => {
            this.activeMenuItem = null;
            this.menuItems.every((menuItem: MenuItem) => {
               if (!menuItem.link || !this.router.isActive(menuItem.link, true)) return true;
                
                this.activeMenuItem = menuItem;
                menuItem.notification = false;
                return false;
            });
        });
    }
    
    constructor(
        private router: Router
    ) {}
}

export interface MenuItem {
    icon: string,
    notification: boolean,
    title: string,
    link?: UrlTree,
    click?: any
}
