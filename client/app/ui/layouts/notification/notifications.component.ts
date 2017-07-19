import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ScrollService} from '../../../services/scroll.service';
import {Notification} from '../../../models/notification';
import {EmptyState} from '../../widgets/state/empty.component';
import {UserService} from '../../../services/user.service';
import {Title} from "@angular/platform-browser";

@Component({
	templateUrl: 'notifications.component.html',
	styleUrls: ['notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
	
	notificationSubscription: Subscription;
	notifications: Notification[];
	emptyState: EmptyState = {
		title: 'Keine Meldungen!',
		image: require('../../../../assets/illustrations/no-notifications.png'),
		description: 'Bisher haben wir keine Meldungen für dich.'
	};
	
	constructor(private userService: UserService,
	            private scrollService: ScrollService,
                private title: Title) {}

	ngOnInit() {
        this.title.setTitle(`Meldungen | rudl.me`);

		// Expeditions.
		this.notificationSubscription = this.scrollService.hasScrolledToBottom().map(() => this.notifications.length).startWith(0).distinct().flatMap((offset: number) => {
			return this.userService.notifications(offset, 25);
		}).subscribe((notifications: Notification[]) => {
			if (notifications.length < 25) this.notificationSubscription.unsubscribe();
			this.notifications = this.notifications ? this.notifications.concat(notifications) : notifications;
		});
	}
	
	ngOnDestroy() {
		this.notificationSubscription.unsubscribe();
	}
}