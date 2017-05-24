import {Component, OnDestroy, OnInit} from "@angular/core";
import {UserService} from "../../../services/user.service";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {User} from "../../../models/user";
import {EmptyState} from "../../widgets/state/empty.component";
import {ScrollService} from '../../../services/scroll.service';

@Component({
    templateUrl: 'user-followees.component.html',
    styleUrls: ['user-followees.component.scss']
})
export class UserFolloweesComponent implements OnInit, OnDestroy {
	
	followeesSubscription: Subscription;
	followees: User[] = null;
	emptyState: EmptyState = {
		title: 'No Followees',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'You are not following anyone. Why not change that?'
	};
	
	constructor(
		private userService: UserService,
		private route: ActivatedRoute,
		private scrollService: ScrollService
	) {}
	
	ngOnInit() {
		this.followeesSubscription = this.route.parent.params.map(params => params['username']).do(() => {
			this.followees = null;
		}).flatMap(username => {
			return this.scrollService.hasScrolledToBottom().map(() => this.followees ? this.followees.length : 0).startWith(0).distinct().flatMap((offset: number) => {
				return this.userService.followees(username, offset, 25);
			});
		}).subscribe((followees: User[]) => {
			if (followees.length < 25) this.followeesSubscription.unsubscribe();
			this.followees = this.followees ? this.followees.concat(followees) : followees;
		});
	}
	
	ngOnDestroy() {
		this.followeesSubscription.unsubscribe();
	}
}
