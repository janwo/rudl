import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {List} from "../../../models/list";
import {ListService} from "../../../services/list.service";
import {EmptyState} from "../../widgets/state/empty.component";
import {ScrollService} from '../../../services/scroll.service';

@Component({
    templateUrl: 'user-lists.component.html',
    styleUrls: ['user-lists.component.scss']
})
export class UserListsComponent implements OnInit, OnDestroy {
	
	listsSubscription: Subscription;
	lists: List[] = null;
	emptyState: EmptyState = {
		title: 'You have no lists',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'You have no lists created yet. Use them to group your Rudels! Others can follow them.'
	};
	
	constructor(
		private listService: ListService,
		private route: ActivatedRoute,
		private scrollService: ScrollService
	) {}
	
	ngOnInit() {
		this.listsSubscription = this.route.parent.params.map(params => params['username']).do(() => {
			this.lists = null;
		}).flatMap(username => {
			return this.scrollService.hasScrolledToBottom().map(() => this.lists ? this.lists.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.listService.by(username, offset, 25);
			});
		}).subscribe((lists: List[]) => {
			if(lists.length < 25) this.listsSubscription.unsubscribe();
			this.lists = this.lists ? this.lists.concat(lists) : lists;
		});
	}
	
	ngOnDestroy() {
		this.listsSubscription.unsubscribe();
	}
}
