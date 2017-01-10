import {
	Component, OnDestroy, OnInit, ViewChild, ElementRef
} from "@angular/core";
import {Subject, Observable, Subscription} from "rxjs";
import {UserService} from "../services/user.service";
import {Activity} from "../models/activity";
import {List} from "../models/list";
import {User} from "../models/user";
import {FullScreenOverlayService} from "./widgets/fullscreen-overlay.component";

@Component({
	templateUrl: './search.component.html',
	styleUrls: ['./search.component.scss'],
	selector: 'search'
})
export class SearchComponent implements OnDestroy, OnInit {
	
	private inputChange: Subject<string> = new Subject();
	private inputSubscription: Subscription;
	private activities: Activity[] = null;
	private collapsedActivities = true;
	private lists: List[] = null;
	private collapsedLists = true;
	private users: User[] = null;
	private collapsedUsers = true;
	private searchValue: string = null;
	@ViewChild('searchInput') searchInput: ElementRef;
	
	constructor(
		private userService: UserService,
	    private fullScreenOverlayService: FullScreenOverlayService
	){}
	
	hideOverlay() {
			this.fullScreenOverlayService.hideOverlay();
	}
	
	ngOnInit(): void {
		this.inputSubscription = this.inputChange.debounceTime(1000).distinctUntilChanged().do(query => {
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
	}
	
	ngOnDestroy(): void {
			this.inputSubscription.unsubscribe();
	}
	
	onKey(event: any) {
		// Submit when pressing enter key.
		if(event.keyCode == 13) {
			console.log('Loose focus');
			event.target.blur();
			return;
		}
		
		this.inputChange.next(event.target.value);
	}
	
	focus(): void {
		this.searchInput.nativeElement.focus();
	}
	
	getSuggestions() {
		
	}
}
