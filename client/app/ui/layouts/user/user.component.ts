import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserService} from '../../../services/user.service';
import {Subject, Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {User} from '../../../models/user';
import {ButtonStyles} from '../../widgets/control/styled-button.component';

@Component({
	templateUrl: 'user.component.html',
	styleUrls: ['user.component.scss']
})
export class UserComponent implements OnInit, OnDestroy {
	
	user: User;
	paramsChangedSubscription: Subscription;
	changeFollowStateSubject: Subject<boolean> = new Subject();
	changeFollowStateSubscription: Subscription;
	
	pendingFollowRequest: boolean = false;
	buttonStyleDefault: ButtonStyles = ButtonStyles.filled;
	buttonStyleFollowing: ButtonStyles = ButtonStyles.outlined;
	
	constructor(private route: ActivatedRoute,
	            private userService: UserService) {}
	
	ngOnInit(): void {
		// Define changed params subscription.
		this.route.data.subscribe((data: { user: User }) => {
			this.user = data.user;
		});
		
		// Define changed follow state subscription.
		this.changeFollowStateSubscription = this.changeFollowStateSubject.asObservable().distinctUntilChanged().flatMap(follow => {
			this.pendingFollowRequest = true;
			return follow ? this.userService.like(this.user.username) : this.userService.dislike(this.user.username);
		}).subscribe((updatedUser: User) => {
			this.user = updatedUser;
			this.pendingFollowRequest = false;
		});
	}
	
	ngOnDestroy(): void {
		this.changeFollowStateSubscription.unsubscribe();
	}
	
	onToggleFollow(): void {
		this.changeFollowStateSubject.next(!this.user.relations.isLikee);
	}
}
