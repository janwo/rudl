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
		this.title.setTitle(`Karte - Streifzug "${this.parent.expedition.getValue().title}" | rudl.me`);
		
		// Define changed params subscription.
		this.externalMapLink = `blank:https://maps.google.com/?q=${this.parent.expedition.getValue().location.latitude},${this.parent.expedition.getValue().location.longitude}`;
	}
}
