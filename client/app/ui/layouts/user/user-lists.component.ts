import {Component, OnInit, OnDestroy} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {List} from "../../../models/list";
import {ListService} from "../../../services/list.service";
import {EmptyState} from "../../widgets/state/empty.component";

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
		private route: ActivatedRoute
	) {}
	
	ngOnInit() {
		this.listsSubscription = this.route.parent.params.map(params => params['username']).do(() => {
			this.lists = null;
		}).flatMap(username => {
			return this.listService.by(username);
		}).subscribe((lists: List[]) => this.lists = lists);
	}
	
	ngOnDestroy() {
		this.listsSubscription.unsubscribe();
	}
}
