import {Component, OnInit, OnDestroy} from "@angular/core";
import {UserService, User} from "../user.service";
import {Subscription} from "rxjs";

@Component({
    template: require('./people.component.html'),
    styles: [require('./people.component.scss')]
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
        this.suggestedUsersSubscription = this.userService.suggestPeople().subscribe((users: User[]) => {
            users.splice(3, Math.max(0, users.length - 3));
            this.suggestedUsers = users;
        });
    }
    
    ngOnDestroy(){
        this.followingUsersSubscription.unsubscribe();
        this.suggestedUsersSubscription.unsubscribe();
    }
}
