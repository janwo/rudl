import {Component, OnDestroy, OnInit} from '@angular/core';
import {Rudel} from '../../../models/rudel';
import {RudelService} from '../../../services/rudel.service';
import {Subscription} from 'rxjs/Subscription';
import {ExpeditionService} from '../../../services/expedition.service';
import {Expedition, ExpeditionRequestResponse} from '../../../models/expedition';
import {ExpeditionItemStyles} from '../../widgets/expedition/expedition-item.component';
import {EmptyState} from "../../widgets/state/empty.component";
import {Title} from "@angular/platform-browser";
import {ButtonStyles} from "../../widgets/control/styled-button.component";

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
	expeditionItemStyle: ExpeditionItemStyles = ExpeditionItemStyles.block;
	expeditionItemButtonStyle: ButtonStyles = ButtonStyles.filledInverse;
	pendingRequest: boolean;

	emptyState: EmptyState = {
		title: 'Keine regionalen Streifzüge gefunden.',
		image: require('../../../../assets/illustrations/no-expeditions.png'),
		description: 'Wir konnten dir keine Streifzüge in deiner Region vorstellen. Sei Organisator!'
	};
	
	constructor(private expeditionService: ExpeditionService,
				private rudelService: RudelService,
				private title: Title) {}
	
	ngOnInit(): void {
		this.title.setTitle('Entdecke Streifzüge | rudl.me');

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

	approve(expedition: Expedition): void {
		this.pendingRequest = true;
		this.expeditionService.approve(expedition.id).subscribe((expeditionRequestResponse: ExpeditionRequestResponse) => {
			this.pendingRequest = false;
            if(this.suggestedExpeditions) this.suggestedExpeditions = this.suggestedExpeditions.map(suggestedExpedition => {
                return expeditionRequestResponse.expedition.id == suggestedExpedition.id ? expeditionRequestResponse.expedition : suggestedExpedition;
            });

            if(this.recentExpeditions) this.recentExpeditions = this.recentExpeditions.map(recentExpedition => {
                return expeditionRequestResponse.expedition.id == recentExpedition.id ? expeditionRequestResponse.expedition : recentExpedition;
            });

            if(this.popularExpeditions) this.popularExpeditions = this.popularExpeditions.map(popularExpedition => {
                return expeditionRequestResponse.expedition.id == popularExpedition.id ? expeditionRequestResponse.expedition : popularExpedition;
            });
		});
	}

    reject(expedition: Expedition): void {
        this.pendingRequest = true;
        this.expeditionService.reject(expedition.id).subscribe((expeditionRequestResponse: ExpeditionRequestResponse) => {
            this.pendingRequest = false;
            if(this.suggestedExpeditions) this.suggestedExpeditions = this.suggestedExpeditions.map(suggestedExpedition => {
                return expeditionRequestResponse.expedition.id == suggestedExpedition.id ? expeditionRequestResponse.expedition : suggestedExpedition;
            });

            if(this.recentExpeditions) this.recentExpeditions = this.recentExpeditions.map(recentExpedition => {
                return expeditionRequestResponse.expedition.id == recentExpedition.id ? expeditionRequestResponse.expedition : recentExpedition;
            });

            if(this.popularExpeditions) this.popularExpeditions = this.popularExpeditions.map(popularExpedition => {
                return expeditionRequestResponse.expedition.id == popularExpedition.id ? expeditionRequestResponse.expedition : popularExpedition;
            });
        });
    }

	dislike(rudel: Rudel): void {
		this.pendingRequest = true;
		this.rudelService.dislike(rudel.id).subscribe(() => {
			this.pendingRequest = false;
			if(this.suggestedExpeditions) this.suggestedExpeditions = this.suggestedExpeditions.filter(suggestedExpedition => {
                return suggestedExpedition.rudel.id != rudel.id;
            });

            if(this.recentExpeditions) this.recentExpeditions = this.recentExpeditions.filter(recentExpedition => {
                return recentExpedition.rudel.id != rudel.id;
            });

            if(this.popularExpeditions) this.popularExpeditions = this.popularExpeditions.filter(popularExpedition => {
                return popularExpedition.rudel.id != rudel.id;
            });
		});
	}
	
	ngOnDestroy(): void {
		this.popularExpeditionsSubscription.unsubscribe();
		this.suggestedExpeditionsSubscription.unsubscribe();
		this.recentExpeditionsSubscription.unsubscribe();
	}
}
