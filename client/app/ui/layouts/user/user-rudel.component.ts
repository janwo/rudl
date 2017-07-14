import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {RudelService} from '../../../services/rudel.service';
import {Rudel} from '../../../models/rudel';
import {EmptyState} from '../../widgets/state/empty.component';
import {ScrollService} from '../../../services/scroll.service';
import {RudelItemStyles} from '../../widgets/rudel/rudel-item.component';
import {User} from "../../../models/user";
import {UserService} from "../../../services/user.service";

@Component({
	templateUrl: 'user-rudel.component.html',
	styleUrls: ['user-rudel.component.scss']
})
export class UserRudelComponent implements OnInit, OnDestroy {
	
	rudelSubscription: Subscription;
	rudel: Rudel[] = null;
	rudelItemStyle: RudelItemStyles = RudelItemStyles.list;
	isAuthenticatedUser: boolean;

	emptyState: EmptyState = {
		title: 'Keinem Rudel angeschlossen',
		image: require('../../../../assets/illustrations/no-rudel.png'),
		description: 'Dieser Nutzer hat sich bisher keinem Rudel angeschlossen.'
	};
	emptyStateAuthenticatedProfile: EmptyState = {
		title: 'Trete einem Rudel bei!',
		image: require('../../../../assets/illustrations/no-rudel.png'),
		description: 'Über die Suche kannst du Rudel suchen oder erstellen.'
	};
	
	constructor(private rudelService: RudelService,
	            private route: ActivatedRoute,
	            private userService: UserService,
	            private scrollService: ScrollService) {}
	
	ngOnInit() {
		this.rudelSubscription = this.route.parent.data.do((data: { user: User }) => {
			this.rudel = null;
            this.isAuthenticatedUser = data.user.id == this.userService.getAuthenticatedUser().user.id;
		}).flatMap((data: { user: User }) => {
			return this.scrollService.hasScrolledToBottom().map(() => this.rudel ? this.rudel.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.rudelService.by(data.user.username, offset, 25);
			});
		}).subscribe((rudel: Rudel[]) => {
			if (rudel.length < 25) this.rudelSubscription.unsubscribe();
			this.rudel = this.rudel ? this.rudel.concat(rudel) : rudel;
		});
	}
	
	ngOnDestroy() {
		this.rudelSubscription.unsubscribe();
	}
}
