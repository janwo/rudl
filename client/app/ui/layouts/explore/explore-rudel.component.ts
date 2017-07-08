import {Component, OnDestroy, OnInit} from '@angular/core';
import {Rudel} from '../../../models/rudel';
import {RudelService} from '../../../services/rudel.service';
import {Subscription} from 'rxjs/Subscription';
import {ExpeditionService} from '../../../services/expedition.service';
import {Expedition} from '../../../models/expedition';
import {RudelItemStyles} from '../../widgets/rudel/rudel-item.component';
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {EmptyState} from "../../widgets/state/empty.component";
import {Title} from "@angular/platform-browser";

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
		title: 'Keine Rudel gefunden',
		image: require('../../../../assets/illustrations/no-rudel.png'),
		description: 'Wir konnten dir keine Rudel vorstellen. Erstelle ein Rudel, indem du den Titel deines Rudels in die Suche eingibst.'
	};

	constructor(private rudelService: RudelService,
				title: Title) {
		title.setTitle('Entdecke Rudel | rudl.me');
	}
	
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
