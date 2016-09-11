import {Component, Input, style, animate, state, transition, trigger} from "@angular/core";

@Component({
    template: require('./popup-menu.component.html'),
    styles: [require('./popup-menu.component.scss')],
    selector: 'popup-menu',
    animations: [
        trigger('flyInOut', [
            state('in', style({transform: 'translateX(0)'})),
            transition('void => *', [
                style({transform: 'translateX(-100%)'}),
                animate(100)
            ]),
            transition('* => void', [
                animate(100, style({transform: 'translateX(100%)'}))
            ])
        ])
    ]
})
export class PopupMenuComponent {
    
    @Input() menuItems : Array<{
        icon: string,
        title: string,
        click?: any
    }> = [];
    
    constructor() {
        
    }
    
    onClick(index: number) {
        let menuItem = this.menuItems[index];
        if(menuItem.click) menuItem.click();
    }
}
