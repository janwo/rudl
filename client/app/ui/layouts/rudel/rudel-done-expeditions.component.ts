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
	templateUrl: 'rudel-done-expeditions.component.html',
	styleUrls: ['rudel-done-expeditions.component.scss']
})
export class RudelDoneExpeditionsComponent implements OnInit, OnDestroy {
	
	rudel: Rudel;
	expeditionsSubscription: Subscription;
	expeditions: Expedition[];
	emptyState: EmptyState = {
		title: 'Keine Streifzüge abgeschlossen',
		image: require('../../../../assets/illustrations/no-done-expeditions.png'),
		description: 'In deiner Nähe wurden bisher keine Streifzüge in diesem Rudel abgeschlossen.'//We couldn\'t find any expeditions you attended to
	};
	
	constructor(private expeditionService: ExpeditionService,
	            private route: ActivatedRoute,
				private parent: RudelComponent,
	            private title: Title,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		this.title.setTitle(`Bisherige Streifzüge - Rudel "${this.parent.rudel.name}" | rudl.me`);

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
