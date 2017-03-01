import {Component, Input, style, animate, transition, trigger} from "@angular/core";
import {Router, UrlTree} from "@angular/router";

@Component({
    templateUrl: './dropdown-menu.component.html',
    styleUrls: ['./dropdown-menu.component.scss'],
    selector: 'dropdown-menu',
    animations: [
        trigger('openClose', [
            transition(':enter', [
                style({
                    transform: 'translateY(-1rem)',
                    opacity: 0
                }),
                animate(100)
            ]),
            transition(':leave', [
                animate(100, style({
                    transform: 'translateY(-1rem)',
                    opacity: 0
                }))
            ])
        ])
    ]
})
export class DropdownMenuComponent {
    
    @Input() menuItems : Array<MenuItem> = [];
    isVisible : boolean = false;
    
    toggle() : void {
        this.isVisible = !this.isVisible;
    }
    
    onClick(menuItem: MenuItem) {
        if(menuItem.click) menuItem.click.call();
        if(menuItem.link) this.router.navigateByUrl(menuItem.link);
    }
    
    constructor(
        private router: Router
    ) {}
}

export interface MenuItem {
    icon?: string,
    title: string,
    click?: any
    link?: UrlTree
}
