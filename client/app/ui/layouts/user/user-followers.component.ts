import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService} from '../../../services/user.service';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {User} from '../../../models/user';
import {EmptyState} from '../../widgets/state/empty.component';
import {ScrollService} from '../../../services/scroll.service';

@Component({
	templateUrl: 'user-followers.component.html',
	styleUrls: ['user-followers.component.scss']
})
export class UserFollowersComponent implements OnInit, OnDestroy {
	
	followersSubscription: Subscription;
	followers: User[] = null;
	emptyState: EmptyState = {
		title: 'No Followers',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'Nobody follows you. Create expeditions to make yourself visible!'
	};
	
	constructor(private userService: UserService,
	            private route: ActivatedRoute,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		this.followersSubscription = this.route.parent.params.map(params => params['username']).do(() => {
			this.followers = null;
		}).flatMap(username => {
			return this.scrollService.hasScrolledToBottom().map(() => this.followers ? this.followers.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.userService.followers(username, offset, 25);
			});
		}).subscribe((followers: User[]) => {
			if (followers.length < 25) this.followersSubscription.unsubscribe();
			this.followers = this.followers ? this.followers.concat(followers) : followers;
		});
	}
	
	ngOnDestroy() {
		this.followersSubscription.unsubscribe();
	}
}

