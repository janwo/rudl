import {Component, OnDestroy, OnInit} from '@angular/core';
import {Rudel} from '../../../models/rudel';
import {RudelService} from '../../../services/rudel.service';
import {Subscription} from 'rxjs/Subscription';
import {ExpeditionService} from '../../../services/expedition.service';
import {Expedition} from '../../../models/expedition';
import {ExpeditionItemStyles} from '../../widgets/expedition/expedition-item.component';

@Component({
	templateUrl: 'explore-expeditions.component.html',
	styleUrls: ['explore-expeditions.component.scss']
})
export class ExploreExpeditionsComponent implements OnInit, OnDestroy {
	
	suggestedExpeditionsSubscription: Subscription;
	suggestedExpeditions: Expedition[];
	recentExpeditionsSubscription: Subscription;
	recentExpeditions: Expedition[];
	popularExpeditionsSubscription: Subscription;
	popularExpeditions: Expedition[];
	rudelItemButtonStyle2: ExpeditionItemStyles = ExpeditionItemStyles.list;
	rudelItemButtonStyle: ExpeditionItemStyles = ExpeditionItemStyles.block;
	
	constructor(private expeditionService: ExpeditionService) {}
	
	ngOnInit(): void {
		this.suggestedExpeditionsSubscription = this.expeditionService.suggested().subscribe((expeditions: Expedition[]) => {
			this.suggestedExpeditions = expeditions;
		});
		
		this.recentExpeditionsSubscription = this.expeditionService.recent().subscribe((expeditions: Expedition[]) => {
			this.recentExpeditions = expeditions;
		});
		
		this.popularExpeditionsSubscription = this.expeditionService.popular().subscribe((expeditions: Expedition[]) => {
			this.popularExpeditions = expeditions;
		});
	}
	
	ngOnDestroy(): void {
		this.popularExpeditionsSubscription.unsubscribe();
		this.suggestedExpeditionsSubscription.unsubscribe();
		this.recentExpeditionsSubscription.unsubscribe();
	}
}
