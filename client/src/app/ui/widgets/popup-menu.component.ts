import {Component, Input} from "@angular/core";

@Component({
    template: require('./popup-menu.component.html'),
    styles: [require('./popup-menu.component.scss')],
    selector: 'popup-menu'
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
        if(menuItem.click) menuItem.click.call();
    }
}
