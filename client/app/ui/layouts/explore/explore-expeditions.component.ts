import {Component, OnDestroy, OnInit} from '@angular/core';
import {Rudel} from '../../../models/rudel';
import {RudelService} from '../../../services/rudel.service';
import {Subscription} from 'rxjs/Subscription';
import {ExpeditionService} from '../../../services/expedition.service';
import {Expedition} from '../../../models/expedition';
import {ExpeditionItemStyles} from '../../widgets/expedition/expedition-item.component';
import {EmptyState} from "../../widgets/state/empty.component";
import {Title} from "@angular/platform-browser";

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
	rudelItemButtonStyle: ExpeditionItemStyles = ExpeditionItemStyles.block;
	emptyState: EmptyState = {
		title: 'Keine Rudel gefunden',
		image: require('../../../../assets/illustrations/no-rudel.png'),
		description: 'Wir konnten dir keine Rudel vorstellen. Erstelle ein Rudel, indem du den Titel deines Rudels in die Suche eingibst.'
	};
	
	constructor(private expeditionService: ExpeditionService,
				title: Title) {
		title.setTitle('Entdecke Streifzüge | rudl.me');
	}
	
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
