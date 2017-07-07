import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService} from '../../../services/user.service';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {User} from '../../../models/user';
import {EmptyState} from '../../widgets/state/empty.component';
import {ScrollService} from '../../../services/scroll.service';

@Component({
	templateUrl: 'user-likees.component.html',
	styleUrls: ['user-likees.component.scss']
})
export class UserLikeesComponent implements OnInit, OnDestroy {
	
	likeesSubscription: Subscription;
	likees: User[] = null;
	isAuthenticatedUser: boolean;

	emptyState: EmptyState = {
		title: 'Folgt keine Nutzer',
		image: require('../../../../assets/illustrations/no-users.png'),
		description: 'Nutzer können ihre Anhänger in Streifzüge einladen.'
	};
	emptyStateAuthenticatedProfile: EmptyState = {
		title: 'Folge andere Nutzer',
		image: require('../../../../assets/illustrations/no-users.png'),
		description: 'Leute, denen du folgst, können dich in Streifzüge einladen.'
	};
	
	constructor(private userService: UserService,
	            private route: ActivatedRoute,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		this.likeesSubscription = this.route.parent.data.do((data: { user: User }) => {
            this.likees = null;
			this.isAuthenticatedUser = data.user.id == this.userService.getAuthenticatedUser().user.id;
		}).flatMap((data: { user: User }) => {
			return this.scrollService.hasScrolledToBottom().map(() => this.likees ? this.likees.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.userService.likees(data.user.username, offset, 25);
			});
		}).subscribe((likees: User[]) => {
			if (likees.length < 25) this.likeesSubscription.unsubscribe();
			this.likees = this.likees ? this.likees.concat(likees) : likees;
		});
	}
	
	ngOnDestroy() {
		this.likeesSubscription.unsubscribe();
	}
}
