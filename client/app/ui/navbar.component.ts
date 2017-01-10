import {Component, OnDestroy} from "@angular/core";
import {TabItem} from "./widgets/tab-menu.component";
import {MenuItem} from "./widgets/dropdown-menu.component";
import {UserService, UserStatus} from "../services/user.service";
import {Router} from "@angular/router";
import {Subscription} from "rxjs";
import {User} from "../models/user";

@Component({
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    selector: 'navbar'
})
export class NavbarComponent implements OnDestroy {
    
    userStatus: UserStatus;
    tabItems: {[key: string]: TabItem};
    menuItems : Array<MenuItem>;
    authenticatedUserSubscription : Subscription;
    
    constructor(
        private router: Router,
        private userService: UserService
    ) {
        // Wait for user information.
        this.authenticatedUserSubscription = this.userService.getAuthenticatedUserObservable().subscribe((userStatus: UserStatus) => {
            // Set user status.
            this.userStatus = userStatus;
            
            // Set menu items.
            this.menuItems = [
                {
                    icon: 'user-md',
                    title: 'Profil',//TODO TRANSLATE
                    link: this.router.createUrlTree(['/people', userStatus.user.username]),
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
    
            // Set tab items.
            this.tabItems = {
                activity: {
                    icon: 'bell-o',
                    title: 'Verlauf',
                    link: this.router.createUrlTree(['/history']),
                    notification: false
                },
                explore: {
                    icon: 'compass',
                    title: 'Entdecken',
                    link: this.router.createUrlTree(['/explore']),
                    notification: false
                },
                people: {
                    icon: 'users',
                    title: 'Leute',
                    link: this.router.createUrlTree(['/people']),
                    notification: false
                }
            };
        });
    }
    
    ngOnDestroy(): void {
        this.authenticatedUserSubscription.unsubscribe();
    }
}
