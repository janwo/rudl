import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {Rudel} from '../../../models/rudel';
import {Expedition} from '../../../models/expedition';
import {ExpeditionService} from '../../../services/expedition.service';
import {EmptyState} from '../../widgets/state/empty.component';
import {ScrollService} from '../../../services/scroll.service';

@Component({
	templateUrl: 'rudel-past-expeditions.component.html',
	styleUrls: ['rudel-past-expeditions.component.scss']
})
export class RudelPastExpeditionsComponent implements OnInit, OnDestroy {
	
	rudel: Rudel;
	expeditionsSubscription: Subscription;
	expeditions: Expedition[];
	emptyState: EmptyState = {
		title: 'Newbie!',
		image: require('../../../../assets/illustrations/welcome.png'),
		description: 'We couldn\'t find any expeditions you attended to!'
	};
	
	constructor(private expeditionService: ExpeditionService,
	            private route: ActivatedRoute,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		// Define changed params subscription.
		this.expeditionsSubscription = this.route.parent.data.flatMap((data: { rudel: Rudel }) => {
			this.rudel = data.rudel;
			return this.scrollService.hasScrolledToBottom().map(() => this.expeditions ? this.expeditions.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.expeditionService.doneByRudel(this.rudel.id, offset, 25);
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
