import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {Rudel} from '../../../models/rudel';
import {List} from '../../../models/list';
import {ListService} from '../../../services/list.service';
import {EmptyState} from '../../widgets/state/empty.component';
import {ScrollService} from '../../../services/scroll.service';
import {Title} from "@angular/platform-browser";

@Component({
	templateUrl: 'list-rudel.component.html',
	styleUrls: ['list-rudel.component.scss']
})
export class ListRudelComponent implements OnInit, OnDestroy {
	
	rudelSubscription: Subscription;
	list: List;
	rudel: Rudel[] = null;
	emptyState: EmptyState = {
		title: 'List is empty',
		image: require('..//../../../assets/illustrations/welcome.png'),
		description: 'There are no rudels in the list yet.'
	};
	
	constructor(private listService: ListService,
	            private route: ActivatedRoute,
	            private scrollService: ScrollService,
				private title: Title) {}
	
	ngOnInit() {
		this.title.setTitle('Rudel der Liste | rudl.me');

		// Define changed params subscription.
		this.rudelSubscription = this.route.parent.data.flatMap((data: { list: List }) => {
			this.list = data.list;
			return this.scrollService.hasScrolledToBottom().map(() => this.rudel ? this.rudel.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.listService.rudel(this.list.id, offset, 25);
			});
		}).subscribe((rudel: Rudel[]) => {
			if (rudel.length < 25) this.rudelSubscription.unsubscribe();
			this.rudel = this.rudel ? this.rudel.concat(rudel) : rudel;
		});
	}
	
	ngOnDestroy(): void {
		this.rudelSubscription.unsubscribe();
	}
}
