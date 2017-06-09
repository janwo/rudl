import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ExpeditionComponent} from './expedition.component';
import {Title} from '@angular/platform-browser';
import {EmptyState} from '../../widgets/state/empty.component';
import {ExpeditionService} from "../../../services/expedition.service";
import {Subscription} from "rxjs/Subscription";
import {ScrollService} from '../../../services/scroll.service';
import {Expedition} from '../../../models/expedition';

@Component({
	templateUrl: 'expeditions-done.component.html',
	styleUrls: ['expeditions-done.component.scss']
})
export class ExpeditionsDoneComponent implements OnInit, OnDestroy {
	
	expeditionsSubscription: Subscription;
	expeditions: Expedition[];
	emptyState: EmptyState = {
		title: 'Keine Streifzüge vollendet',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t find any expeditions you attended to!'
	};
	
	constructor(private expeditionService: ExpeditionService,
	            private scrollService: ScrollService,
	            private title: Title) {}
	
	ngOnInit() {
		this.title.setTitle(`rudl.me - Streifzug "Bisherige Streifzüge"`);
		
		// Expeditions.
		this.expeditionsSubscription = this.scrollService.hasScrolledToBottom().map(() => this.expeditions.length).startWith(0).distinct().flatMap((offset: number) => {
			return this.expeditionService.done(offset, 25);
		}).subscribe((expeditions: Expedition[]) => {
			if (expeditions.length < 25) this.expeditionsSubscription.unsubscribe();
			this.expeditions = this.expeditions ? this.expeditions.concat(expeditions) : expeditions;
		});
	}
	
	ngOnDestroy() {
		this.expeditionsSubscription.unsubscribe();
	}
}
