import {Component, OnInit, OnDestroy} from "@angular/core";
import {UserService} from "../../../services/user.service";
import {Subscription, Subject} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {User} from "../../../models/user";
import {ButtonStyles} from "../../widgets/controls/styled-button.component";

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
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleFollowing: ButtonStyles = ButtonStyles.minimalInverse;
    
    constructor(
        private route: ActivatedRoute,
        private userService: UserService
    ) {}
    
    ngOnInit(): void {
        // Define changed params subscription.
        this.paramsChangedSubscription = this.route.params.distinctUntilChanged((x, y) => x['username'] == y['username']).flatMap(params => {
            return this.userService.get(params['username']);
        }).subscribe((user: User) => this.user = user);
        
        // Define changed follow state subscription.
        this.changeFollowStateSubscription = this.changeFollowStateSubject.asObservable().distinctUntilChanged().flatMap(follow => {
            this.pendingFollowRequest = true;
            return follow ? this.userService.follow(this.user.username) : this.userService.unfollow(this.user.username);
        }).subscribe((updatedUser: User) => {
            this.user = updatedUser;
            this.pendingFollowRequest = false;
        });
    }
    
    ngOnDestroy(): void {
        if(this.paramsChangedSubscription) this.paramsChangedSubscription.unsubscribe();
    }
    
    onToggleFollow(): void {
        this.changeFollowStateSubject.next(!this.user.relations.isFollowee);
    }
}
