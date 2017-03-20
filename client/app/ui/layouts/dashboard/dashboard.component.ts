import {Component, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {UserStatus, UserService} from "../../../services/user.service";
import {SearchService, SearchState} from "../../../services/search.service";
import {Router, NavigationEnd} from "@angular/router";

@Component({
    templateUrl: 'dashboard.component.html',
    styleUrls: ['dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
	
    userStatus: UserStatus = {
    	loggedIn: false,
	    user: null
    };
    authenticatedUserSubscription : Subscription;
    onSearchModeChangedSubscription : Subscription;
    onSaveLastLocationSubscription : Subscription;
    
    lastUrl: string[] = ['/'];
    inSearchMode: boolean = false;
    
	dropDownMenuItems: any[] = [];
	tabMenuItems: any[] = [];
    
    constructor(
        private router: Router,
        private userService: UserService,
        private searchService: SearchService
    ) {}
    
    ngOnInit(): void {
        // Wait for user information.
        this.authenticatedUserSubscription = this.userService.getAuthenticatedUserObservable().subscribe((userStatus: UserStatus) => {
            this.dropDownMenuItems = [];
            
	        // Add menu items for boarded user.
	        if(userStatus.loggedIn && userStatus.user.meta.onBoard) {
		        this.dropDownMenuItems.push({
			        icon: 'paw',
			        title: 'Deine Rudel',//TODO TRANSLATE
			        link: userStatus.loggedIn ? this.router.createUrlTree(['/people', userStatus.user.username, 'rudel']) : null
		        });
		
		        this.dropDownMenuItems.push({
			        icon: 'list',
			        title: 'Deine Listen',//TODO TRANSLATE
			        link: userStatus.loggedIn ? this.router.createUrlTree(['/people', userStatus.user.username, 'lists']) : null
		        });
	        }
	
	        // Add default menu items.
	        this.dropDownMenuItems.push({
		        icon: 'cog',
		        title: 'Einstellungen',
		        link: this.router.createUrlTree(['/settings'])
	        });
	
	        this.dropDownMenuItems.push({
		        icon: 'sign-out',
		        title: 'Abmelden',
		        click: () => this.userService.signOut()
	        });
            
            // Set tab items.
            this.tabMenuItems = [
                {
                    icon: 'compass',
                    title: 'Entdecken',
                    link: this.router.createUrlTree(['/explore'])
                },
	            {
                    icon: 'users',
                    title: 'Rudler',
                    link: this.router.createUrlTree(['/people'])
                },
	            {
                    icon: 'search',
                    title: 'Suche',
                    link: this.router.createUrlTree(['/search'])
                }
            ];
	
	        // Set user status.
	        this.userStatus = userStatus;
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
    
    signOut(): void {
    	this.userService.signOut();
    }
    
    ngOnDestroy(): void {
        this.onSearchModeChangedSubscription.unsubscribe();
        this.authenticatedUserSubscription.unsubscribe();
        this.onSaveLastLocationSubscription.unsubscribe();
    }
}
