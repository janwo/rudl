import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {Rudel} from '../../../models/rudel';
import {Expedition} from '../../../models/expedition';
import {ExpeditionService} from '../../../services/expedition.service';
import {EmptyState} from '../../widgets/state/empty.component';
import {ScrollService} from '../../../services/scroll.service';
import {RudelComponent} from "./rudel.component";
import {Title} from "@angular/platform-browser";

@Component({
	templateUrl: 'rudel-upcoming-expeditions.component.html',
	styleUrls: ['rudel-upcoming-expeditions.component.scss']
})
export class RudelUpcomingExpeditionsComponent implements OnInit, OnDestroy {
	
	rudel: Rudel;
	expeditionsSubscription: Subscription;
	expeditions: Expedition[];
	emptyState: EmptyState = {
		title: 'Organisiere einen Streifzug in deiner Region!',
		image: require('../../../../assets/illustrations/no-upcoming-expeditions.png'),
		description: 'Wir konnten in deiner Region keine bevorstehenden Streifzüge in diesem Rudel finden. Werde jetzt Organisator!'//We couldn\'t find any expeditions around here. Create one and make your locals happy!
	};
	
	constructor(private expeditionService: ExpeditionService,
	            private route: ActivatedRoute,
                private parent: RudelComponent,
                private title: Title,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		this.title.setTitle(`Zukünftige Streifzüge - Rudel "${this.parent.rudel.name}" | rudl.me`);

		// Define changed params subscription.
		this.expeditionsSubscription = this.route.parent.data.flatMap((data: { rudel: Rudel }) => {
			this.rudel = data.rudel;
			return this.scrollService.hasScrolledToBottom().map(() => this.expeditions ? this.expeditions.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.expeditionService.upcomingByRudel(this.rudel.id, offset, 25);
			});
		}).subscribe((expeditions: Expedition[]) => {
			if (expeditions.length < 25) this.expeditionsSubscription.unsubscribe();
			this.expeditions = this.expeditions ? this.expeditions.concat(expeditions) : expeditions;
		});
	}
	
	ngOnDestroy(): void {
		this.expeditionsSubscription.unsubscribe();
	}
}
