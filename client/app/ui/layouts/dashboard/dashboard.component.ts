import {Component, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {UserService, UserStatus} from '../../../services/user.service';
import {SearchService, SearchState} from '../../../services/search.service';
import {NavigationEnd, Router} from '@angular/router';
import {ScrollService} from '../../../services/scroll.service';

@Component({
	templateUrl: 'dashboard.component.html',
	styleUrls: ['dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
	
	userStatus: UserStatus = {
		loggedIn: false,
		user: null
	};
	authenticatedUserSubscription: Subscription;
	onSearchModeChangedSubscription: Subscription;
	onSaveLastLocationSubscription: Subscription;
	
	lastUrl: string[] = ['/'];
	inSearchMode: boolean = false;
	
	constructor(private router: Router,
	            private userService: UserService,
	            private searchService: SearchService,
	            private scrollService: ScrollService) {}
	
	ngOnInit(): void {
		// Wait for user information.
		this.authenticatedUserSubscription = this.userService.getAuthenticatedUserObservable().subscribe((userStatus: UserStatus) => {
			// Set user status.
			this.userStatus = userStatus;
		});
		
		// React to any search mode changes.
		this.onSearchModeChangedSubscription = this.searchService.onSearchEvent.map(expedition => expedition.state).distinctUntilChanged().subscribe((state: SearchState) => {
			this.inSearchMode = state == SearchState.OPENED;
		});
		
		// Save last non search location.
		this.onSaveLastLocationSubscription = this.router.events.filter(event => {
			return event instanceof NavigationEnd && !this.router.isActive(this.router.createUrlTree(['/search']), false);
		}).map((event: any) => event.url).subscribe(url => this.lastUrl = [url]);
	}
	
	signOut(): void {
		this.userService.signOut();
	}
	
	ngOnDestroy(): void {
		this.onSearchModeChangedSubscription.unsubscribe();
		this.authenticatedUserSubscription.unsubscribe();
		this.onSaveLastLocationSubscription.unsubscribe();
	}
	
	scrolledToBottom(event: Event): void {
		this.scrollService.scrolledToBottom(event);
	}
}
