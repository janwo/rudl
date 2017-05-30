import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ExpeditionComponent} from './expedition.component';
import {Title} from '@angular/platform-browser';

@Component({
	templateUrl: 'expedition-map.component.html',
	styleUrls: ['expedition-map.component.scss']
})
export class ExpeditionMapComponent implements OnInit {
	
	externalMapLink: string;
	
	constructor(private route: ActivatedRoute,
	            private title: Title,
	            public parent: ExpeditionComponent) {}
	
	ngOnInit() {
		this.title.setTitle(`rudl.me - Streifzug "${this.parent.expedition.getValue().title}" - Karte`);
		
		// Define changed params subscription.
		this.externalMapLink = `https://maps.google.com/?q=${this.parent.expedition.getValue().location.lat},${this.parent.expedition.getValue().location.lng}`;
	}
}
