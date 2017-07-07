import {
    AfterViewInit, Component, ElementRef, Input, OnChanges, Optional, SimpleChanges,
    ViewChild
} from '@angular/core';
import * as L from 'leaflet';
import {ControlValueAccessor, NgControl} from '@angular/forms';
import {Location} from "../../../../models/location";

@Component({
	templateUrl: 'location-picker.component.html',
	styleUrls: ['location-picker.component.scss'],
	selector: 'location-picker'
})
export class LocationPickerComponent implements AfterViewInit, ControlValueAccessor, OnChanges {
	
	private static source = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
	private static quotas: any = {
		red: 21,
		green: 71,
		blue: 8,
		dividerTune: 0,
		divider: () => LocationPickerComponent.quotas.red + LocationPickerComponent.quotas.green + LocationPickerComponent.quotas.blue + LocationPickerComponent.quotas.dividerTune
	};

    private location: Location = {
        latitude: 0,
        longitude: 0
    };

    private map: L.Map;
    private marker: L.Marker;
    private indicatorMarkers: L.Marker[];

	constructor(@Optional() ngControl: NgControl) {
		if (ngControl) ngControl.valueAccessor = this;
	}

    @Input() zoom: number = 16;
    @Input() indicators: Location[];
	@ViewChild('map') mapElement: ElementRef;
	
	ngAfterViewInit(): void {
		// Create app.
		this.map = L.map(this.mapElement.nativeElement, {
			dragging: true,
			zoomControl: false,
			scrollWheelZoom: true,
			touchZoom: true,
			doubleClickZoom: true,
			boxZoom: true,
			tap: true,
			keyboard: false,
			zoom: this.zoom
		});
		
		// Add zoom control
		L.control.zoom({
			position: 'bottomleft'
		}).addTo(this.map);
		
		// Add map layer.
		new L.TileLayer(LocationPickerComponent.source, {
			crossOrigin: true,
            attribution: 'Maps provided by © <a target="_blank" href="https://openstreetmap.org/copyright">OpenStreetMap</a> Contributors via <a target="_blank" href="http://leafletjs.com">Leaflet</a>'
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
			iconUrl: require('../../../../../assets/marker/large.png') as string,
			className: 'leaflet-icon'
		});
		
		this.marker = L.marker(new L.LatLng(this.location.latitude, this.location.longitude), {
			icon: icon,
			clickable: false,
            zIndexOffset: 50
		}).addTo(this.map);
		
		this.map.on('click', (e: any) => {
			this.setLocation({
				latitude: e.latlng.lat,
				longitude: e.latlng.lng
			});
			this.onChange(this.location);
			this.onTouched();
		});
	}
	
	private setLocation(location: Location): void {
		this.location = location;
		
		if (this.marker) this.marker.setLatLng(new L.LatLng(this.location.latitude, this.location.longitude));
		if (this.map) this.map.panTo(new L.LatLng(this.location.latitude, this.location.longitude));
	}

    private setIndicators(locations: Location[]): void {
        if (!this.map) return;

        if (this.indicatorMarkers) this.indicatorMarkers.forEach(indicator => {
            this.map.removeLayer(indicator);
        });

        let icon = L.icon({
            iconUrl: require('../../../../../assets/marker/small.png') as string,
            className: 'leaflet-small-icon'
        });

        this.indicatorMarkers = locations.map(location => {
            return L.marker(new L.LatLng(location.latitude, location.longitude), {
                icon: icon,
                clickable: false,
                zIndexOffset: 5
            }).addTo(this.map);
        });
    }
	
	writeValue(value: Location): void {
		if (value) this.setLocation(value);
	}
	
	onChange = (_: any) => {};
	onTouched = () => {};
	
	registerOnChange(fn: (_: any) => void): void { this.onChange = fn; }
	
	registerOnTouched(fn: () => void): void { this.onTouched = fn; }

    ngOnChanges(changes: SimpleChanges): void {
        if(changes.indicators) this.setIndicators(changes.indicators.currentValue as Location[]);
    }
}
