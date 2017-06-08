import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ScrollService} from '../../../services/scroll.service';
import {Expedition} from '../../../models/expedition';
import {ExpeditionService} from '../../../services/expedition.service';
import {EmptyState} from '../../widgets/state/empty.component';

@Component({
	templateUrl: 'expeditions.component.html',
	styleUrls: ['expeditions.component.scss']
})
export class ExpeditionsComponent implements OnInit, OnDestroy {
	
	expeditionsSubscription: Subscription;
	expeditions: Expedition[];
	emptyState: EmptyState = {
		title: 'Newbie!',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t find any expeditions you attended to!'
	};
	
	constructor(private expeditionService: ExpeditionService,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		// Expeditions.
		this.expeditionsSubscription = this.scrollService.hasScrolledToBottom().map(() => this.expeditions.length).startWith(0).distinct().flatMap((offset: number) => {
			return this.expeditionService.by('me', offset, 25);
		}).subscribe((expeditions: Expedition[]) => {
			if (expeditions.length < 25) this.expeditionsSubscription.unsubscribe();
			this.expeditions = this.expeditions ? this.expeditions.concat(expeditions) : expeditions;
			this.expeditions = this.expeditions ? this.expeditions.concat(expeditions) : expeditions;
		});
	}
	
	ngOnDestroy() {
		this.expeditionsSubscription.unsubscribe();
	}
}
