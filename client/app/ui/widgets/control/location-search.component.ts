import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {GeocodeLocation, GeocodeService} from "../../../services/geocode.service";
import {ReplaySubject, Subject, Subscription} from "rxjs";

@Component({
	templateUrl: 'location-search.component.html',
	styleUrls: ['location-search.component.scss'],
	selector: 'location-search'
})
export class LocationSearchComponent implements OnInit, OnDestroy {
	
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
		this.searchResultsObservable = this.searchEvent.asObservable().do(() => this.locations = []).filter((query: string) => query.length >= 3).distinctUntilChanged().debounceTime(500).flatMap((query: string) => {
			return this.geocodeService.search(query, this.locationFocus);
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
		this.searchElement.nativeElement.value = null;
		this.locations = [];
		this.locationSelected.emit(location);
	}
}
