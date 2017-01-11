import {
	Component, ViewChild, ElementRef, OnInit, OnDestroy, Input
} from "@angular/core";
import {Subscription} from "rxjs";
import {SearchService, SearchState} from "../../services/search.service";

@Component({
	templateUrl: './search-bar.component.html',
	styleUrls: ['./search-bar.component.scss'],
	selector: 'search-bar'
})
export class SearchBarComponent implements OnInit, OnDestroy{
	
	private onQueryChangedSubscription: Subscription;
	@ViewChild('searchInput') searchInput: ElementRef;
	@Input() autoFocus: boolean = false;
	
	constructor(
		private searchService: SearchService
	) {}
	
	ngOnInit(): void {
		// Receive any values from search service.
		this.onQueryChangedSubscription = this.searchService.onQueryChanged.subscribe(value => {
			this.searchInput.nativeElement.value = value;
		});
		
		// Autofocus?
		if(this.autoFocus) this.focus();
	}
	
	ngOnDestroy(): void {
		this.onQueryChangedSubscription.unsubscribe();
	}
	
	onKey(event: any) {
		// Blur element, as soon as user is pressing enter key.
		this.submit(event.keyCode == 13);
	}
	
	submit(blur: boolean = false){
		let element = this.searchInput.nativeElement;
		if(blur) element.blur();
		this.searchService.search(element.value);
	}
	
	focus(): void {
		this.searchInput.nativeElement.focus();
	}
}
