import {Component} from "@angular/core";

@Component({
    templateUrl: 'header.component.html',
    styleUrls: ['header.component.scss'],
    selector: 'header'
})
export class HeaderComponent {
    
    tabItems = [
        {
            icon: 'bell-o',
            title: 'Verlauf',
            notification: true,
            click: () => {console.log('bell-o');}
        },
        {
            icon: 'compass',
            title: 'Entdecken',
            notification: false,
            click: () => {console.log('compass');}
        },
        {
            icon: 'users',
            title: 'Freunde',
            notification: false,
            click: () => {console.log('users');}
        }
    ];
    
    menuItems = [
        {
            icon: 'user-md',
            title: 'Profil',
            click: () => {console.log('user-md');}
        },
        {
            icon: 'cog',
            title: 'Einstellungen',
            click: () => {console.log('cog');}
        },
        {
            icon: 'sign-out',
            title: 'Abmelden',
            click: () => {console.log('sign-out');}
        }
    ];
    
    popupMenuIsVisible : boolean = true;
    
    togglePopupMenu() {
        this.popupMenuIsVisible = !this.popupMenuIsVisible;
    }
    
    constructor() {
        
    }
}
