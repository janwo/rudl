import {Component, OnDestroy, OnInit} from "@angular/core";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {Observable, Subscription} from "rxjs";
import {UserService} from "../../../services/user.service";
import {Rudel} from "../../../models/rudel";
import {List} from "../../../models/list";
import {User} from "../../../models/user";
import {SearchService} from "../../../services/search.service";
import {ActivatedRoute} from "@angular/router";
import {ListService} from "../../../services/list.service";
import {RudelService} from "../../../services/rudel.service";

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
	
	rudel: Rudel[] = null;
	collapsedRudel: boolean = true;
	expandedRudelCreation: boolean = false;
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
		private rudelService: RudelService,
	    private searchService: SearchService,
	    private activatedRoute: ActivatedRoute
	){}
	
	ngOnInit(): void {
		// Register for query changes.
		this.querySubscription = this.searchService.onQueryChangedDebounced.do(() => {
			this.searchValue = null;
			this.rudel = null;
			this.lists = null;
			this.users = null;
		}).filter(query => query && query.length >= 3).flatMap((query: string) => {
			return Observable.zip(
				this.rudelService.like(query, 0, 5),
				this.listService.like(query, 0, 5),
				this.userService.like(query, 0, 5),
				Observable.from([query])
			);
		}).subscribe((values: [Rudel[], List[], User[], string]) => {
			this.searchValue = values[3];
			this.rudel = values[0];
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
