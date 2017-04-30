import {Component, OnDestroy, OnInit} from "@angular/core";
import {Expedition} from '../../../models/expedition';
import {Subscription} from "rxjs/Subscription";
import {ActivatedRoute} from '@angular/router';

@Component({
    templateUrl: 'expedition-map.component.html',
    styleUrls: ['expedition-map.component.scss']
})
export class ExpeditionMapComponent implements OnInit, OnDestroy {
	
	expedition: Expedition;
	externalMapLink: string;
	expeditionSubscription: Subscription;
	
	constructor(
		private route: ActivatedRoute
	) {}
	
	ngOnInit(){
		// Define changed params subscription.
		this.expeditionSubscription = this.route.parent.data.subscribe((data: { expedition: Expedition }) => {
		    this.expedition = data.expedition;
		    this.externalMapLink = `https://maps.google.com/?q=${data.expedition.location.latLng.join()}`;
	    });
	}
	
	ngOnDestroy(): void {
		this.expeditionSubscription.unsubscribe();
	}
}
