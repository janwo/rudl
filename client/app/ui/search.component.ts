import {
	Component, OnDestroy, OnInit, ViewChild, ElementRef, EventEmitter, Input
} from "@angular/core";
import {Subject, Observable, Subscription} from "rxjs";
import {UserService} from "../services/user.service";
import {Activity} from "../models/activity";
import {List} from "../models/list";
import {User} from "../models/user";
import {SearchService} from "../services/search.service";
import {ActivatedRoute} from "@angular/router";

@Component({
	templateUrl: './search.component.html',
	styleUrls: ['./search.component.scss'],
	selector: 'search'
})
export class SearchComponent implements OnDestroy, OnInit {
	
	private activities: Activity[] = null;
	private collapsedActivities = true;
	private lists: List[] = null;
	private collapsedLists = true;
	private users: User[] = null;
	private collapsedUsers = true;
	private querySubscription: Subscription;
	private searchValue: string = null;
	
	constructor(
		private userService: UserService,
	    private searchService: SearchService,
	    private activatedRoute: ActivatedRoute
	){}
	
	ngOnInit(): void {
		// Register for query changes.
		this.querySubscription = this.searchService.onQueryChangedDebounced.do(query => {
			this.searchValue = null;
			this.activities = null;
			this.lists = null;
			this.users = null;
		}).filter(query => query && query.length >= 3).flatMap((query: string) => {
			return Observable.zip(
				this.userService.activitiesLike(query),
				this.userService.listsLike(query),
				this.userService.usersLike(query),
				Observable.from([query])
			);
		}).subscribe((values: [Activity[], List[], User[], string]) => {
			this.searchValue = values[3];
			this.activities = values[0];
			this.lists = values[1];
			this.users = values[2];
		});
		
		// Get current route on startup and call search service to search for query or just open search.
		this.activatedRoute.params.map(params => params['query']).first().forEach(query => {
			if(query) {
				this.searchService.search(query);
				return;
			}
			
			this.searchService.start();
		});
	}
	
	ngOnDestroy(): void {
		this.querySubscription.unsubscribe();
	}
}
