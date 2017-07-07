import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ExpeditionComponent} from './expedition.component';
import {Title} from '@angular/platform-browser';
import {EmptyState} from '../../widgets/state/empty.component';
import {Subscription} from 'rxjs/Subscription';
import {ExpeditionService} from '../../../services/expedition.service';
import {ScrollService} from '../../../services/scroll.service';
import {Expedition} from "../../../models/expedition";

@Component({
	templateUrl: 'expeditions-upcoming.component.html',
	styleUrls: ['expeditions-upcoming.component.scss']
})
export class ExpeditionsUpcomingComponent implements OnInit {
	
	expeditionsSubscription: Subscription;
	expeditions: Expedition[];
	emptyState: EmptyState = {
		title: 'Keine künftigen Streifzüge',
		image: require('../../../../assets/illustrations/no-upcoming-expeditions.png'),
		description: 'Du hast dich noch keinem Streifzug angeschlossen.'
	};
	
	constructor(private expeditionService: ExpeditionService,
	            private scrollService: ScrollService,
	            private title: Title) {}
	
	ngOnInit() {
		this.title.setTitle(`rudl.me | Streifzug "Zukünftige Streifzüge"`);
		
		// Expeditions.
		this.expeditionsSubscription = this.scrollService.hasScrolledToBottom().map(() => this.expeditions.length).startWith(0).distinct().flatMap((offset: number) => {
			return this.expeditionService.upcoming(offset, 25);
		}).subscribe((expeditions: Expedition[]) => {
			if (expeditions.length < 25) this.expeditionsSubscription.unsubscribe();
			this.expeditions = this.expeditions ? this.expeditions.concat(expeditions) : expeditions;
		});
	}
	
	ngOnDestroy() {
		this.expeditionsSubscription.unsubscribe();
	}
}
