import {Component, ViewChild, AfterViewInit, OnInit} from "@angular/core";
import {SearchBarComponent} from "./widgets/search-bar.component";
import {Subscription} from "rxjs";
import {UserStatus, UserService} from "../services/user.service";
import {MenuItem} from "./widgets/dropdown-menu.component";
import {TabItem} from "./widgets/tab-menu.component";
import {SearchService, SearchState} from "../services/search.service";
import {Router, NavigationEnd} from "@angular/router";
import {ModalComponent} from "./widgets/modal.component";

@Component({
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    
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
        this.authenticatedUserSubscription = this.userService.getAuthenticatedUserObservable().do(userStatus => {
            // Set user status.
            this.userStatus = userStatus;
        }).subscribe(() => {
            // Set menu items.
            this.menuItems = [];
            
            // Add menu items for boarded user.
            if(this.userStatus.loggedIn && this.userStatus.user.meta.onBoard) {
                this.menuItems.push({
                    icon: 'list',
                    title: 'Deine Listen',//TODO TRANSLATE
                    link: this.userStatus.loggedIn ? this.router.createUrlTree(['/people', this.userStatus.user.username, 'lists']) : null
                });
    
                this.menuItems.push({
                    icon: 'heart-o',
                    title: 'Deine Interessen',//TODO TRANSLATE
                    link: this.userStatus.loggedIn ? this.router.createUrlTree(['/people', this.userStatus.user.username, 'activities']) : null
                });
            }
            
            // Add default menu items.
            this.menuItems.push({
                    icon: 'cog',
                    title: 'Einstellungen',
                    link: this.router.createUrlTree(['/settings'])
                });
               
            this.menuItems.push({
                icon: 'sign-out',
                title: 'Abmelden',
                click: () => this.userService.signOut()
            });
            
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
