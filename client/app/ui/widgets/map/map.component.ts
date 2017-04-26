import {
	AfterViewInit,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges,
	ViewChild
} from "@angular/core";
import * as L from "leaflet";

@Component({
    templateUrl: 'map.component.html',
    styleUrls: ['map.component.scss'],
    selector: 'map'
})
export class MapComponent implements AfterViewInit, OnChanges {
 
	private static iconUrl = require('../../../../assets/map-marker.png') as string;
    private static source = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    private static quotas: any = {
        red: 21,
        green: 71,
        blue: 8,
        dividerTune: 0,
        divider: () => MapComponent.quotas.red + MapComponent.quotas.green + MapComponent.quotas.blue + MapComponent.quotas.dividerTune
    };
	
	@Input() location: L.LatLngTuple = [0,0];
	@Input() accuracy: number = 0;
    @Input() zoom: number = 16;
    @ViewChild('map') mapElement: ElementRef;
    @Output() change: EventEmitter<L.LatLngTuple> = new EventEmitter();
    
	map: L.Map;
	centerPointLayer: L.Layer;
	accuracyLayer: L.Layer;
 
	ngAfterViewInit(): void {
		// Create app.
		this.map = L.map(this.mapElement.nativeElement, {
			dragging: false,
			zoomControl: false,
			scrollWheelZoom: false,
			touchZoom: false,
			doubleClickZoom: false,
			boxZoom: false,
			tap: false,
			center: this.location,
			keyboard: false,
			attributionControl: false,
			zoom: this.zoom
		});
		
		// Add map layer.
		new L.TileLayer(MapComponent.source, {
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
			for (let i = 0, n = pix.length; i < n; i += 4) pix[i] = pix[i + 1] = pix[i + 2] = (MapComponent.quotas.red * pix[i] + MapComponent.quotas.green * pix[i + 1] + MapComponent.quotas.blue * pix[i + 2]) / MapComponent.quotas.divider();
			ctx.putImageData(imgd, 0, 0);
			e.tile.setAttribute('data-grayscaled', 'true');
			e.tile.src = canvas.toDataURL();
		}).addTo(this.map);
		
		// Set location.
		this.setLocation(this.location, this.accuracy);
	}
	
	setLocation(location: L.LatLngTuple, accuracy: number = 0): void {
		// Pan map.
		this.map.panTo(location);
		
		// Remove markers.
		if(this.accuracyLayer) this.map.removeLayer(this.accuracyLayer);
		if(this.centerPointLayer) this.map.removeLayer(this.centerPointLayer);
		
		// Add inaccurate marker.
		if(accuracy > 0) this.accuracyLayer = new L.Circle(location, accuracy, {
			stroke: true,
			weight: 10,
			color: '#fff',
			opacity: 0.25,
			fill: true,
			fillColor: '#50e3c2',
			fillOpacity: 0.75
		}).addTo(this.map);
		
		// Add center marker.
		this.centerPointLayer = L.marker(location, {
			icon: L.icon({
				iconUrl: MapComponent.iconUrl,
				className: 'leaflet-icon'
			}),
			clickable: false
		}).addTo(this.map);
	}
	
	ngOnChanges(changes: SimpleChanges): void {
    	if(!this.map || !(changes.location || changes.accuracy)) return;
		let location = changes.location.currentValue || this.location;
	    let accuracy = changes.accuracy.currentValue || this.accuracy;
	    this.setLocation(location, accuracy);
	}
}
