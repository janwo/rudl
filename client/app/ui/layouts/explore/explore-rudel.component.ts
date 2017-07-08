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
	pendingRequest: boolean;

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

    like(rudel: Rudel): void {
        this.pendingRequest = true;
        this.rudelService.like(rudel.id).subscribe((rudel: Rudel) => {
            this.pendingRequest = false;
            if(this.suggestedRudel) {
                let idx = this.suggestedRudel.findIndex(suggestedRudel => suggestedRudel.id == rudel.id);
                if(idx >= 0) this.suggestedRudel[idx] = rudel;
            }

            if(this.recentRudel) {
                let idx = this.recentRudel.findIndex(recentRudel => recentRudel.id == rudel.id);
                if(idx >= 0) this.recentRudel[idx] = rudel;
            }

            if(this.popularRudel) {
                let idx = this.popularRudel.findIndex(popularRudel => popularRudel.id == rudel.id);
                if(idx >= 0) this.popularRudel[idx] = rudel;
            }
        });
    }

    dislike(rudel: Rudel): void {
        this.pendingRequest = true;
        this.rudelService.dislike(rudel.id).subscribe(() => {
            this.pendingRequest = false;
            if(this.suggestedRudel) {
                let idx = this.suggestedRudel.findIndex(suggestedRudel => suggestedRudel.id == rudel.id);
                if(idx >= 0) this.suggestedRudel.splice(idx, 1);
            }

            if(this.recentRudel) {
                let idx = this.recentRudel.findIndex(recentRudel => recentRudel.id == rudel.id);
                if(idx >= 0) this.recentRudel.splice(idx, 1);
            }

            if(this.popularRudel) {
                let idx = this.popularRudel.findIndex(popularRudel => popularRudel.id == rudel.id);
                if(idx >= 0) this.popularRudel.splice(idx, 1);
            }
        });
    }
	
	ngOnDestroy(): void {
		this.popularRudelSubscription.unsubscribe();
		this.suggestedRudelSubscription.unsubscribe();
		this.recentRudelSubscription.unsubscribe();
	}
}
