import {AfterViewInit, Component, ElementRef, Input, Optional, ViewChild} from "@angular/core";
import * as L from "leaflet";
import {ControlValueAccessor, NgControl} from "@angular/forms";
import {Location} from "../../../../models/location";

@Component({
    templateUrl: 'location-picker.component.html',
    styleUrls: ['location-picker.component.scss'],
    selector: 'location-picker'
})
export class LocationPickerComponent implements AfterViewInit, ControlValueAccessor {
    
    private static source = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    private static quotas: any = {
        red: 21,
        green: 71,
        blue: 8,
        dividerTune: 0,
        divider: () => LocationPickerComponent.quotas.red + LocationPickerComponent.quotas.green + LocationPickerComponent.quotas.blue + LocationPickerComponent.quotas.dividerTune
    };
    
	constructor(@Optional() ngControl: NgControl) {
		if (ngControl) ngControl.valueAccessor = this;
	}
    
    location: Location = {
		lat: 0,
	    lng: 0
    };
    @Input() zoom: number = 16;
    @ViewChild('map') mapElement: ElementRef;
    
	map: L.Map;
	marker: L.Marker;
 
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
			center: this.location,
			keyboard: false,
			attributionControl: false,
			zoom: this.zoom
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
			iconUrl: require('../../../../../assets/map-marker.png') as string,
			className: 'leaflet-icon'
		});
		
		this.marker = L.marker(this.location, {
			icon: icon,
			clickable: false
		}).addTo(this.map);
		
		this.map.on('click', (e: any) => {
			this.setLocation(e.latlng);
			this.onChange(this.location);
			this.onTouched();
		});
	}
	
	private setLocation(location: Location): void {
		this.location = location;
		
		if(this.marker) this.marker.setLatLng(this.location);
		if(this.map) this.map.panTo(this.location);
	}
	
	writeValue(value: Location): void {
		if(value) this.setLocation(value);
	}
	
	onChange = (_: any) => {};
	onTouched = () => {};
	registerOnChange(fn: (_: any) => void): void { this.onChange = fn; }
	registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}