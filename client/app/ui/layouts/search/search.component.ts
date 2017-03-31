import {Component, OnDestroy, OnInit} from "@angular/core";
import {trigger, transition, style, animate, state} from "@angular/animations";
import {Observable, Subscription} from "rxjs";
import {UserService} from "../../../services/user.service";
import {Activity} from "../../../models/activity";
import {List} from "../../../models/list";
import {User} from "../../../models/user";
import {SearchService} from "../../../services/search.service";
import {ActivatedRoute} from "@angular/router";
import {ListService} from "../../../services/list.service";
import {ActivityService} from "../../../services/activity.service";

@Component({
	templateUrl: 'search.component.html',
	styleUrls: ['search.component.scss'],
	selector: 'search',
	animations: [
		trigger('container', [
			state('*', style({
				height: '*',
				opacity: 1
			})),
			state('void', style({
				height: 0,
				opacity: 0
			})),
			transition(':leave', animate('0.3s')),
			transition(':enter', animate('0.3s'))
		])
	]
})
export class SearchComponent implements OnDestroy, OnInit {
	
	activities: Activity[] = null;
	collapsedActivities: boolean = true;
	expandedActivityCreation: boolean = false;
	lists: List[] = null;
	collapsedLists: boolean = true;
	expandedListCreation: boolean = false;
	users: User[] = null;
	collapsedUsers: boolean = true;
	querySubscription: Subscription;
	searchValue: string = null;
	
	constructor(
		private listService: ListService,
		private userService: UserService,
		private activityService: ActivityService,
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
				this.activityService.like(query),
				this.listService.like(query),
				this.userService.like(query),
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
	
	log(j:any){
			console.log(j);
}
	
	ngOnDestroy(): void {
		this.searchService.cancel();
		this.querySubscription.unsubscribe();
	}
}
