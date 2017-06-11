import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService} from '../../../services/user.service';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {User} from '../../../models/user';
import {EmptyState} from '../../widgets/state/empty.component';
import {ScrollService} from '../../../services/scroll.service';

@Component({
	templateUrl: 'user-likers.component.html',
	styleUrls: ['user-likers.component.scss']
})
export class UserLikersComponent implements OnInit, OnDestroy {
	
	likersSubscription: Subscription;
	likers: User[] = null;
	emptyState: EmptyState = {
		title: 'No Likers',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'Nobody follows you. Create expeditions to make yourself visible!'
	};
	
	constructor(private userService: UserService,
	            private route: ActivatedRoute,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		this.likersSubscription = this.route.parent.params.map(params => params['username']).do(() => {
			this.likers = null;
		}).flatMap(username => {
			return this.scrollService.hasScrolledToBottom().map(() => this.likers ? this.likers.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.userService.likers(username, offset, 25);
			});
		}).subscribe((likers: User[]) => {
			if (likers.length < 25) this.likersSubscription.unsubscribe();
			this.likers = this.likers ? this.likers.concat(likers) : likers;
		});
	}
	
	ngOnDestroy() {
		this.likersSubscription.unsubscribe();
	}
}

