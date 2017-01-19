import {
	Component, ViewChild, ElementRef, OnInit, OnDestroy
} from "@angular/core";
import {Subscription} from "rxjs";
import {SearchService, SearchState} from "../../services/search.service";

@Component({
	templateUrl: './search-bar.component.html',
	styleUrls: ['./search-bar.component.scss'],
	selector: 'search-bar'
})
export class SearchBarComponent implements OnInit, OnDestroy{
	
	private onSearchStateChangedSubscription: Subscription;
	private onQueryChangedSubscription: Subscription;
	@ViewChild('searchInput') searchInput: ElementRef;
	
	constructor(
		private searchService: SearchService
	) {}
	
	ngOnInit(): void {
		// Receive any values from search service.
		this.onSearchStateChangedSubscription = this.searchService.onSearchEvent.distinctUntilChanged((x, y) => x.state === y.state).subscribe(event => {
			if(event.state == SearchState.OPENED) this.searchInput.nativeElement.focus();
		});
		
		this.onQueryChangedSubscription = this.searchService.onSearchEvent.distinctUntilChanged((x, y) => x.query === y.query).subscribe(event => {
			if(this.searchInput.nativeElement.value != event.query) this.searchInput.nativeElement.value = event.query;
		});
	}
	
	ngOnDestroy(): void {
		this.onQueryChangedSubscription.unsubscribe();
		this.onSearchStateChangedSubscription.unsubscribe();
	}
	
	onKey(event: any) {
		// Blur element, as soon as user is pressing enter key.
		let element = this.searchInput.nativeElement;
		if(event.keyCode == 13) element.blur();
		this.searchService.search(element.value);
	}
}
