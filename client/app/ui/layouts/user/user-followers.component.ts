import {Component, OnInit, OnDestroy} from "@angular/core";
import {UserService} from "../../../services/user.service";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {User} from "../../../models/user";
import {EmptyState} from "../../widgets/state/empty.component";

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
		description: 'Nobody follows you. Create events to make yourself visible!'
	};
	
	constructor(
		private userService: UserService,
		private route: ActivatedRoute
	) {}
	
	ngOnInit() {
		this.followersSubscription = this.route.parent.params.map(params => params['username']).do(() => {
			this.followers = null;
		}).flatMap(username => {
			return this.userService.followers(username);
		}).subscribe((followers: User[]) => this.followers = followers);
	}
	
	ngOnDestroy() {
		this.followersSubscription.unsubscribe();
	}
}

