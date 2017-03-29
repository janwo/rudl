import {Component} from "@angular/core";
import {trigger, transition, style, animate} from "@angular/animations";
import {MenuComponent} from "./menu.component";

@Component({
    templateUrl: 'dropdown-menu.component.html',
    styleUrls: ['dropdown-menu.component.scss'],
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
export class DropdownMenuComponent extends MenuComponent {
    
    isVisible : boolean = false;
    
    toggle() : void {
        this.isVisible = !this.isVisible;
    }
}
