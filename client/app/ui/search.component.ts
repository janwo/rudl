import {
	Component, OnDestroy, OnInit, ViewChild, ElementRef, EventEmitter, Input, trigger, transition, style, animate, state
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
	selector: 'search',
	animations: [
		trigger('container', [
			state('true', style({
				height: '*',
				opacity: 1
			})),
			state('false', style({
				height: 0,
				opacity: 0
			})),
			transition('1 => 0', animate('300ms')),
			transition('0 => 1', animate('300ms'))
		])
	]
})
export class SearchComponent implements OnDestroy, OnInit {
	
	private activities: Activity[] = null;
	private collapsedActivities: boolean = true;
	private expandedActivityCreation: boolean = false;
	private lists: List[] = null;
	private collapsedLists: boolean = true;
	private expandedListCreation: boolean = false;
	private users: User[] = null;
	private collapsedUsers: boolean = true;
	private querySubscription: Subscription;
	private searchValue: string = null;
	
	constructor(
		private userService: UserService,
	    private searchService: SearchService,
	    private activatedRoute: ActivatedRoute
	){}
	
	ngOnInit(): void {
		// Register for query changes.
		this.querySubscription = this.searchService.onQueryChangedDebounced.do(() => {
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
		this.activatedRoute.params.map(params => params['query']).forEach(query => this.searchService.search(query));
	}
	
	ngOnDestroy(): void {
		this.searchService.cancel();
		this.querySubscription.unsubscribe();
	}
}
