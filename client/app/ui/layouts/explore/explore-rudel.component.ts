import {Component, OnDestroy, OnInit} from '@angular/core';
import {Rudel} from '../../../models/rudel';
import {RudelService} from '../../../services/rudel.service';
import {Subscription} from 'rxjs/Subscription';
import {ExpeditionService} from '../../../services/expedition.service';
import {Expedition} from '../../../models/expedition';
import {RudelItemStyles} from '../../widgets/rudel/rudel-item.component';
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {EmptyState} from "../../widgets/state/empty.component";

@Component({
	templateUrl: 'explore-rudel.component.html',
	styleUrls: ['explore-rudel.component.scss']
})
export class ExploreRudelComponent implements OnInit, OnDestroy {
	
	suggestedRudelSubscription: Subscription;
	suggestedRudel: Rudel[];
	recentRudelSubscription: Subscription;
	recentRudel: Rudel[];
	popularRudelSubscription: Subscription;
	popularRudel: Rudel[];
	rudelItemStyle: RudelItemStyles = RudelItemStyles.block;
	rudelItemButtonStyle: ButtonStyles = ButtonStyles.filledInverse;
	emptyState: EmptyState = {
		title: 'Keine regionale Streifzüge gefunden.',
		image: require('../../../../assets/illustrations/no-expeditions.png'),
		description: 'Wir konnten dir keine Streifzüge in deiner Region vorstellen. Sei Organisator!'
	};
	
	constructor(private rudelService: RudelService) {}
	
	ngOnInit(): void {
		this.suggestedRudelSubscription = this.rudelService.suggested().subscribe((rudel: Rudel[]) => {
			this.suggestedRudel = rudel;
		});
		
		this.recentRudelSubscription = this.rudelService.recent().subscribe((rudel: Rudel[]) => {
			this.recentRudel = rudel;
		});
		
		this.popularRudelSubscription = this.rudelService.popular().subscribe((rudel: Rudel[]) => {
			this.popularRudel = rudel;
		});
	}
	
	ngOnDestroy(): void {
		this.popularRudelSubscription.unsubscribe();
		this.suggestedRudelSubscription.unsubscribe();
		this.recentRudelSubscription.unsubscribe();
	}
}
