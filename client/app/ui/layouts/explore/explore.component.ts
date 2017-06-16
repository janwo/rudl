import {Component, OnDestroy, OnInit} from '@angular/core';
import {Rudel} from '../../../models/rudel';
import {RudelService} from '../../../services/rudel.service';
import {Subscription} from 'rxjs/Subscription';
import {ExpeditionService} from '../../../services/expedition.service';
import {Expedition} from '../../../models/expedition';

@Component({
	templateUrl: 'explore.component.html',
	styleUrls: ['explore.component.scss']
})
export class ExploreComponent implements OnInit, OnDestroy {
	
	suggestedRudelSubscription: Subscription;
	suggestedRudel: Rudel[];
	nearbyExpeditionsSubscription: Subscription;
	nearbyExpeditions: Expedition[];
	
	constructor(private rudelService: RudelService,
	            private expeditionService: ExpeditionService) {}
	
	ngOnInit(): void {
		this.suggestedRudelSubscription = this.rudelService.suggestRudel().subscribe((rudel: Rudel[]) => {
			this.suggestedRudel = rudel;
		});
		
		this.nearbyExpeditionsSubscription = this.expeditionService.nearby().subscribe((expeditions: Expedition[]) => {
			this.nearbyExpeditions = expeditions;
			this.nearbyExpeditions = expeditions.concat(expeditions);
		});
	}
	
	ngOnDestroy(): void {
		this.suggestedRudelSubscription.unsubscribe();
		this.nearbyExpeditionsSubscription.unsubscribe();
	}
}
