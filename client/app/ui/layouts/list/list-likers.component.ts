import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {User} from '../../../models/user';
import {ListService} from '../../../services/list.service';
import {List} from '../../../models/list';
import {ScrollService} from '../../../services/scroll.service';
import {Title} from "@angular/platform-browser";

@Component({
	templateUrl: 'list-likers.component.html',
	styleUrls: ['list-likers.component.scss']
})
export class ListLikersComponent implements OnInit, OnDestroy {
	
	likers: User[];
	likersSubscription: Subscription;
	list: List;
	
	constructor(private listService: ListService,
	            private route: ActivatedRoute,
	            private scrollService: ScrollService,
				private title: Title) {}
	
	ngOnInit() {
		this.title.setTitle('Likers der Liste | rudl.me');

		// Define changed params subscription.
		this.likersSubscription = this.route.parent.data.flatMap((data: { list: List }) => {
			this.list = data.list;
			return this.scrollService.hasScrolledToBottom().map(() => this.likers ? this.likers.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.listService.likers(this.list.id, offset, 25);
			});
		}).subscribe((likers: User[]) => {
			if (likers.length < 25) this.likersSubscription.unsubscribe();
			this.likers = this.likers ? this.likers.concat(likers) : likers;
		});
	}
	
	ngOnDestroy(): void {
		this.likersSubscription.unsubscribe();
	}
}
