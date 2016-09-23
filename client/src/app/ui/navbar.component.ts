import {Component} from "@angular/core";
import {TabItem} from "./widgets/tab-menu.component";
import {MenuItem} from "./widgets/dropdown-menu.component";
import {UserService} from "../user.service";

@Component({
    template: require('./navbar.component.html'),
    styles: [require('./navbar.component.scss')],
    selector: 'navbar'
})
export class NavbarComponent {
    
    tabItems : Array<TabItem> = [
        {
            icon: 'bell-o',
            title: 'Verlauf',
            link: '/activity',
            notification: false
        },
        {
            icon: 'compass',
            title: 'Entdecken',
            link: '/explore',
            notification: false
        },
        {
            icon: 'users',
            title: 'Leute',
            link: '/people',
            notification: false
        }
    ];
    menuItems : Array<MenuItem> = [
        {
            icon: 'user-md',
            title: 'Profil',
            link: '/profile',
            notification: false
        },
        {
            icon: 'cog',
            title: 'Einstellungen',
            link: '/settings',
            notification: false
        },
        {
            icon: 'sign-out',
            title: 'Abmelden',
            click: () => this.userService.signOut(),
            notification: false
        }
    ];
    
    constructor(
        private userService: UserService
    ) {}
}
