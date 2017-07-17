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
				private title: Title) {}
	
	ngOnInit(): void {
		this.title.setTitle('Entdecke Rudel | rudl.me');

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
            if(this.suggestedRudel) this.suggestedRudel = this.suggestedRudel.map(suggestedRudel => {
                return rudel.id == suggestedRudel.id ? rudel : suggestedRudel;
            });

            if(this.recentRudel) this.recentRudel = this.recentRudel.map(recentRudel => {
                return rudel.id == recentRudel.id ? rudel : recentRudel;
            });

            if(this.popularRudel) this.popularRudel = this.popularRudel.map(popularRudel => {
                return rudel.id == popularRudel.id ? rudel : popularRudel;
            });
        });
    }

    dislike(rudel: Rudel): void {
        this.pendingRequest = true;
        this.rudelService.dislike(rudel.id).subscribe(() => {
            this.pendingRequest = false;
            if(this.suggestedRudel) this.suggestedRudel = this.suggestedRudel.filter(suggestedRudel => suggestedRudel.id != rudel.id);

            if(this.recentRudel) this.recentRudel = this.recentRudel.filter(recentRudel => recentRudel.id != rudel.id);

            if(this.popularRudel) this.popularRudel = this.popularRudel.filter(popularRudel => popularRudel.id != rudel.id);
        });
    }
	
	ngOnDestroy(): void {
		this.popularRudelSubscription.unsubscribe();
		this.suggestedRudelSubscription.unsubscribe();
		this.recentRudelSubscription.unsubscribe();
	}
}
