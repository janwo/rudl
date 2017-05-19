import {Component, OnDestroy, OnInit} from "@angular/core";
import {User} from "../../../models/user";
import {UserService} from "../../../services/user.service";
import {Subscription} from "rxjs";

@Component({
    templateUrl: 'people.component.html',
    styleUrls: ['people.component.scss']
})
export class PeopleComponent implements OnInit, OnDestroy {
    
    followingUsersSubscription: Subscription;
    followingUsers: User[];
    suggestedUsers: User[];
    suggestedUsersSubscription: Subscription;
    
    constructor(
        private userService: UserService
    ) {}
    
    ngOnInit(){
        this.followingUsersSubscription = this.userService.followees().subscribe((users: User[]) => this.followingUsers = users);
        this.suggestedUsersSubscription = this.userService.suggestedPeople().subscribe((users: User[]) => {
            this.suggestedUsers = users;
        });
    }
    
    ngOnDestroy(){
        this.followingUsersSubscription.unsubscribe();
        this.suggestedUsersSubscription.unsubscribe();
    }
}
