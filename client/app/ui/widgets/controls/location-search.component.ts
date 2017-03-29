import {
	Component, Input, EventEmitter, Output, HostBinding, ElementRef, ViewChild, OnInit, OnDestroy
} from "@angular/core";
import {GeocodeService, GeocodeLocation} from "../../../services/geocode.service";
import { Subject, ReplaySubject, Subscription} from "rxjs";

@Component({
	templateUrl: 'location-search.component.html',
	styleUrls: ['location-search.component.scss'],
	selector: 'location-search'
})
export class LocationSearchComponent implements OnInit, OnDestroy {
	
	@HostBinding('class.focused') focused: boolean = false;
	@ViewChild('searchElement') searchElement: ElementRef;
	@Input() locationFocus: number[] = [0, 0];
	@Output() locationSelected: EventEmitter<number[]> = new EventEmitter();
	
	locations: GeocodeLocation[] = [];
	searchResultsObservable: Subscription;
	searchEvent: Subject<string> = new ReplaySubject(1);
	
	constructor(
		private geocodeService: GeocodeService
	){}
	
	ngOnInit(): void {
		// Set up search observable.
		this.searchResultsObservable = this.searchEvent.asObservable().filter((query: string) => query.length >= 3).distinctUntilChanged().debounceTime(1000).flatMap((query: string) => {
			return this.geocodeService.search(query, [0,0]);
		}).subscribe((locations: GeocodeLocation[]) => this.locations = locations);
	}
	
	ngOnDestroy(): void {
		this.searchResultsObservable.unsubscribe();
	}
	
	
	onKey(event: any): void {
		this.searchEvent.next(this.searchElement.nativeElement.value);
		if(event.keyCode == 13) this.searchElement.nativeElement.blur();
	}
	
	onClick(event: any, location: number[]): void {
		this.locations = [];
		this.locationSelected.emit(location);
	}
}
