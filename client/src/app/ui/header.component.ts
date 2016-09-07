import {Component} from "@angular/core";

@Component({
    template: require('./header.component.html'),
    styles: [require('./header.component.scss')],
    selector: 'header'
})
export class HeaderComponent {
    
    private menuItems = [
        {
            icon: 'user-md',
            title: 'Profil'
        },
        {
            icon: 'cog',
            title: 'Einstellungen'
        },
        {
            icon: 'sign-out',
            title: 'Abmelden'
        }
    ];
    
    private tabItems = [
        {
            icon: 'bell-o',
            title: 'Verlauf',
            notification: true
        },
        {
            icon: 'compass',
            title: 'Entdecken',
            notification: false
        },
        {
            icon: 'users',
            title: 'Freunde',
            notification: false
        }
    ];
    
    private tabIndex: number;
    
    private setActiveTab(index: number) {
        this.tabIndex = index;
        this.tabItems[index].notification = false;
    }
    
    constructor() {
        this.setActiveTab(Math.trunc(this.tabItems.length / 2));
    }
}
