import {Component} from "@angular/core";
import {TabItem} from "./widgets/tab-menu.component";
import {MenuItem} from "./widgets/dropdown-menu.component";
import {UserService} from "../user.service";
import {Router} from "@angular/router";

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
            link: this.router.createUrlTree(['/activity']),
            notification: false
        },
        {
            icon: 'compass',
            title: 'Entdecken',
            link: this.router.createUrlTree(['/explore']),
            notification: false
        },
        {
            icon: 'users',
            title: 'Leute',
            link: this.router.createUrlTree(['/people']),
            notification: false
        }
    ];
    menuItems : Array<MenuItem> = [
        {
            icon: 'user-md',
            title: 'Profil',
            link: this.router.createUrlTree(['/me']),
            notification: false
        },
        {
            icon: 'cog',
            title: 'Einstellungen',
            link: this.router.createUrlTree(['/settings']),
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
        private router: Router,
        private userService: UserService
    ) {}
}
