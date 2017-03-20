import {
	Component, Input, EventEmitter, Output, HostBinding, trigger,
	style, transition, animate, ElementRef, ViewChild, AfterViewInit, state, OnInit, OnDestroy
} from "@angular/core";
import * as L from "leaflet";
import {GeocodeService, GeocodeLocation} from "../../../services/geocode.service";
import { Subject, ReplaySubject, Subscription} from "rxjs";

@Component({
	templateUrl: 'locationpicker.component.html',
	styleUrls: ['locationpicker.component.scss'],
	selector: 'locationpicker',
	animations: [
		trigger('expandVertically', [
			state('true', style({
				height: '*',
				opacity: 1
			})),
			state('false', style({
				height: 0,
				opacity: 0
			})),
			transition('1 => 0', animate('0.3s')),
			transition('0 => 1', animate('0.3s'))
		]),
		trigger('slideInGeocoder', [
			state('true', style({
				transform: 'translateX(-100%)'
			})),
			state('false', style({
				transform: 'translateX(0%)'
			})),
			transition('1 => 0', animate('0.3s')),
			transition('0 => 1', animate('0.3s'))
		])
	]
})
export class LocationPickerComponent implements AfterViewInit, OnInit, OnDestroy {
	
	private static source = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
	private static quotas: any = {
		red: 21,
		green: 71,
		blue: 8,
		dividerTune: 0,
		divider: () => LocationPickerComponent.quotas.red + LocationPickerComponent.quotas.green + LocationPickerComponent.quotas.blue + LocationPickerComponent.quotas.dividerTune
	};
	
	@HostBinding('class.focused') expanded: boolean = false;
	geocodingMode: boolean = false;
	dirty: boolean = false;
	map: L.Map;
	marker: L.Marker;
	geocodedLocations: GeocodeLocation[];
	@Input() location: number[];
	@Input() defaultLocation: number[] = [0, 0];
	@ViewChild('mapElement') mapElement: ElementRef;
	@ViewChild('searchElement') searchElement: ElementRef;
	@Output() change: EventEmitter<string> = new EventEmitter();
	searchResultsObservable: Subscription;
	searchEvent: Subject<string> = new ReplaySubject(1);
	
	constructor(
		private geocodeService: GeocodeService
	){}
	
	ngOnInit(): void {
		// Set location state.
		this.dirty = !!this.location;
		if(!this.location) this.location = this.defaultLocation;
			
		// Set up search observable.
		this.searchResultsObservable = this.searchEvent.asObservable().filter((query: string) => query.length >= 3).distinctUntilChanged().debounceTime(1000).flatMap((query: string) => {
			return this.geocodeService.search(query, this.location);
		}).subscribe((locations: GeocodeLocation[]) => this.geocodedLocations = locations);
	}
	
	ngOnDestroy(): void {
		this.searchResultsObservable.unsubscribe();
	}
	
	ngAfterViewInit(): void {
		// Convert to LatLng object.
		let center = L.latLng(this.location[0], this.location[1]);
		
		// Create app.
		this.map = L.map(this.mapElement.nativeElement, {
			dragging: true,
			zoomControl: false,
			scrollWheelZoom: true,
			touchZoom: true,
			doubleClickZoom: true,
			boxZoom: true,
			tap: true,
			center: center,
			keyboard: false,
			attributionControl: false,
			zoom: 14
		});
		
		// Add zoom control
		L.control.zoom({
			position: 'bottomleft'
		}).addTo(this.map);
		
		// Add map layer.
		new L.TileLayer(LocationPickerComponent.source, {
			crossOrigin: true,
		}).on('tileload', (e: L.TileEvent) => {
			if (e.tile.getAttribute('data-grayscaled')) return;
			
			let canvas = document.createElement("canvas");
			canvas.width = e.tile.width;
			canvas.height = e.tile.height;
			let ctx = canvas.getContext("2d");
			ctx.drawImage(e.tile, 0, 0);
			
			let imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
			let pix = imgd.data;
			for (let i = 0, n = pix.length; i < n; i += 4) pix[i] = pix[i + 1] = pix[i + 2] = (LocationPickerComponent.quotas.red * pix[i] + LocationPickerComponent.quotas.green * pix[i + 1] + LocationPickerComponent.quotas.blue * pix[i + 2]) / LocationPickerComponent.quotas.divider();
			ctx.putImageData(imgd, 0, 0);
			e.tile.setAttribute('data-grayscaled', 'true');
			e.tile.src = canvas.toDataURL();
		}).addTo(this.map);
		
		let icon = L.icon({
			iconUrl: require('../../../../assets/map-marker.png') as string,
			className: 'leaflet-icon'
		});
		
		this.marker = L.marker(center, {
			icon: icon
		}).on('click', () => this.toggleExpandState()).addTo(this.map);
		
		this.map.on('click', (e: any) => this.setLocation([e.latlng.lat, e.latlng.lng]));
	}
	
	toggleExpandState(): void {
		this.expanded = !this.expanded;
	}
	
	updateMap() {
		// Convert to LatLng object.
		let center = L.latLng(this.location[0], this.location[1]);
		
		// Set settings.
		this.map.invalidateSize();
		this.marker.setLatLng(center);
		this.map.panTo(center);
	}
	
	onKey(event: any): void {
		this.searchEvent.next(this.searchElement.nativeElement.value);
		if(event.keyCode == 13) this.searchElement.nativeElement.blur();
	}
	
	setLocation(location: number[]): void {
		this.location = location;
		this.dirty = true;
		this.updateMap();
	}
}
