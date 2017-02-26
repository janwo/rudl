import {Component, Input, ViewChild, ElementRef, OnInit} from "@angular/core";
import * as L from "leaflet";

@Component({
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    selector: 'map'
})
export class MapComponent implements OnInit {
    
    private static source = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    private static attribution = 'Map data &copy; <a target="_blank" href="https://openstreetmap.org/">OpenStreetMap</a>';
    private static quotas: any = {
        red: 21,
        green: 71,
        blue: 8,
        dividerTune: 0,
        divider: () => MapComponent.quotas.red + MapComponent.quotas.green + MapComponent.quotas.blue + MapComponent.quotas.dividerTune
    };
    
    @Input() location: L.LatLngTuple = [0,0];
    @Input() zoom: number = 16;
    @Input() accuracy: number = 300;
    @ViewChild('map') map: ElementRef;
    
    ngOnInit(): void {
        // Create app.
        let map = L.map(this.map.nativeElement, {
            dragging: false,
            zoomControl: false,
            scrollWheelZoom: false,
            touchZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            tap: false,
            center: L.latLng(this.location[0], this.location[1]),
            keyboard: false,
            maxZoom: this.zoom,
            attributionControl: false,
            zoom: this.zoom,
            minZoom: this.zoom
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
        }).addTo(map);
        
        // Add circle layer.
        L.circle(this.location, this.accuracy, {
            stroke: true,
            weight: 10,
            color: '#fff',
            opacity: 0.25,
            fill: true,
            fillColor: '#50e3c2',
            fillOpacity: 0.75
        }).addTo(map);
    }
}
