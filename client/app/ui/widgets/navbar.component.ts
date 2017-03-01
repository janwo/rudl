import {Component, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {TabItem} from "./tab-menu.component";
import {MenuItem} from "./dropdown-menu.component";
import {UserService, UserStatus} from "../../services/user.service";
import {Router, NavigationEnd} from "@angular/router";
import {Subscription} from "rxjs";
import {SearchService, SearchState} from "../../services/search.service";
import {SearchBarComponent} from "./search-bar.component";

@Component({
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    selector: 'navbar'
})
export class NavbarComponent implements OnInit, OnDestroy {
    
    userStatus: UserStatus;
    authenticatedUserSubscription : Subscription;
    onSearchModeChangedSubscription : Subscription;
    onSaveLastLocationSubscription : Subscription;
    tabItems: {[key: string]: TabItem};
    menuItems: MenuItem[];
    lastUrl: string[] = ['/'];
    inSearchMode: boolean = false;
    @ViewChild('searchBar') searchBar: SearchBarComponent;
    
    constructor(
        private router: Router,
        private userService: UserService,
        private searchService: SearchService
    ) {}
    
    ngOnInit(): void {
        // Wait for user information.
        this.authenticatedUserSubscription = this.userService.getAuthenticatedUserObservable().subscribe((userStatus: UserStatus) => {
            // Set user status.
            this.userStatus = userStatus;
            
            // Set menu items.
            this.menuItems = [
                {
                    icon: 'list',
                    title: 'Deine Listen',//TODO TRANSLATE
                    link: userStatus.loggedIn ? this.router.createUrlTree(['/people', userStatus.user.username, 'lists']) : null
                },
                {
                    icon: 'heart-o',
                    title: 'Deine Interessen',//TODO TRANSLATE
                    link: userStatus.loggedIn ? this.router.createUrlTree(['/people', userStatus.user.username, 'activities']) : null
                },
                {
                    icon: 'cog',
                    title: 'Einstellungen',
                    link: this.router.createUrlTree(['/settings'])
                },
                {
                    icon: 'sign-out',
                    title: 'Abmelden',
                    click: () => this.userService.signOut()
                }
            ];
            
            // Set tab items.
            this.tabItems = {
                /*TODO: Verlauf wieder einfügen
                activity: {
                    icon: 'bell-o',
                    title: 'Verlauf',
                    link: this.router.createUrlTree(['/history']),
                    notification: false
                },*/
                explore: {
                    icon: 'compass',
                    title: 'Entdecken',
                    link: this.router.createUrlTree(['/explore']),
                    notification: false
                },
                people: {
                    icon: 'users',
                    title: 'Rudler',
                    link: this.router.createUrlTree(['/people']),
                    notification: false
                },
                search: {
                    icon: 'search',
                    title: 'Suche',
                    link: this.router.createUrlTree(['/search']),
                    notification: false
                }
            };
        });
        
        // React to any search mode changes.
        this.onSearchModeChangedSubscription = this.searchService.onSearchEvent.map(event => event.state).distinctUntilChanged().subscribe((state: SearchState) => {
            this.inSearchMode = state == SearchState.OPENED;
        });
        
        // Save last non search location.
        this.onSaveLastLocationSubscription = this.router.events.filter(event => {
            return event instanceof NavigationEnd && !this.router.isActive(this.router.createUrlTree(['/search']), false);
        }).map(event => event.url).subscribe(url => this.lastUrl = [ url ]);
    }
    
    ngOnDestroy(): void {
        this.onSearchModeChangedSubscription.unsubscribe();
        this.authenticatedUserSubscription.unsubscribe();
        this.onSaveLastLocationSubscription.unsubscribe();
    }
}
