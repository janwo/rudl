import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {List} from '../../../models/list';
import {ListService} from '../../../services/list.service';
import {EmptyState} from '../../widgets/state/empty.component';
import {ScrollService} from '../../../services/scroll.service';
import {User} from "../../../models/user";
import {UserService} from "../../../services/user.service";
import {UserComponent} from "./user.component";
import {Title} from "@angular/platform-browser";

@Component({
	templateUrl: 'user-lists.component.html',
	styleUrls: ['user-lists.component.scss']
})
export class UserListsComponent implements OnInit, OnDestroy {
	
	listsSubscription: Subscription;
	lists: List[] = null;
    isAuthenticatedUser: boolean;

	emptyState: EmptyState = {
		title: 'You have no lists',
		image: require('../../../../assets/illustrations/no-lists.png'),
		description: 'You have no lists created yet. Use them to group your Rudels! Others can follow them.'
	};
	
	constructor(private listService: ListService,
	            private route: ActivatedRoute,
				private title: Title,
				private parent: UserComponent,
	            private userService: UserService,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		this.title.setTitle(`Listen - ${this.parent.user.username} - rudl.me`);

		this.listsSubscription = this.route.parent.data.do((data: { user: User }) => {
			this.lists = null;
			this.isAuthenticatedUser = data.user.id == this.userService.getAuthenticatedUser().user.id;
		}).flatMap((data: { user: User }) => {
			return this.scrollService.hasScrolledToBottom().map(() => this.lists ? this.lists.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.listService.by(data.user.username, offset, 25);
			});
		}).subscribe((lists: List[]) => {
			if (lists.length < 25) this.listsSubscription.unsubscribe();
			this.lists = this.lists ? this.lists.concat(lists) : lists;
		});
	}
	
	ngOnDestroy() {
		this.listsSubscription.unsubscribe();
	}
}
