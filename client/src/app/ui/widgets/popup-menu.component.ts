import {Component, Input, style, animate, state, transition, trigger} from "@angular/core";

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
export class PopupMenuComponent {
    
    @Input() menuItems : Array<{
        icon: string,
        title: string,
        click?: any
    }> = [];
    animationState : string | boolean = false;
    
    constructor() {
        
    }
    
    toggle() : void {
        this.animationState = this.animationState ? false : 'opened';
    }
    
    onClick(index: number) {
        let menuItem = this.menuItems[index];
        if(menuItem.click) menuItem.click();
    }
}
