import {Component, OnInit, OnDestroy} from "@angular/core";
import {UserService} from "../../../services/user.service";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {User} from "../../../models/user";
import {EmptyState} from "../../widgets/state/empty.component";

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
		private route: ActivatedRoute
	) {}
	
	ngOnInit() {
		this.followeesSubscription = this.route.parent.params.map(params => params['username']).do(() => {
			this.followees = null;
		}).flatMap(username => {
			return this.userService.followees(username);
		}).subscribe((followees: User[]) => this.followees = followees);
	}
	
	ngOnDestroy() {
		this.followeesSubscription.unsubscribe();
	}
}
