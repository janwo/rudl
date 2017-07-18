import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService} from '../../../services/user.service';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {User} from '../../../models/user';
import {EmptyState} from '../../widgets/state/empty.component';
import {ScrollService} from '../../../services/scroll.service';
import {UserComponent} from "./user.component";
import {Title} from "@angular/platform-browser";

@Component({
	templateUrl: 'user-likers.component.html',
	styleUrls: ['user-likers.component.scss']
})
export class UserLikersComponent implements OnInit, OnDestroy {
	
	likersSubscription: Subscription;
	likers: User[] = null;
	isAuthenticatedUser: boolean;

	emptyState: EmptyState = {
		title: 'Einsamer Wolf',
		image: require('../../../../assets/illustrations/no-users.png'),
		description: 'Keiner folgt diesem Nutzer. Sei der Erste!'//Nobody follows you. Create expeditions to make yourself visible!
	};
	emptyStateAuthenticatedProfile: EmptyState = {
		title: 'Einsamer Wolf',
		image: require('../../../../assets/illustrations/no-users.png'),
		description: 'Keiner folgt dir bisher. Mach aktiv mit, um dich sichtbar zumachen.'//Nobody follows you. Create expeditions to make yourself visible!
	};
	
	constructor(private userService: UserService,
	            private route: ActivatedRoute,
				private title: Title,
				private parent: UserComponent,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		this.title.setTitle(`Anhänger - ${this.parent.user.username} - rudl.me`);

		this.likersSubscription = this.route.parent.data.do((data: { user: User }) => {
			this.likers = null;
			this.isAuthenticatedUser = data.user.id == this.userService.getAuthenticatedUser().user.id;
		}).flatMap((data: { user: User }) => {
			return this.scrollService.hasScrolledToBottom().map(() => this.likers ? this.likers.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.userService.likers(data.user.username, offset, 25);
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

