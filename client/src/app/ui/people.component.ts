import {Component, OnInit, OnDestroy} from "@angular/core";
import {UserService} from "../user.service";
import {Subscription} from "rxjs";

@Component({
    template: require('./people.component.html'),
    styles: [require('./people.component.scss')]
})
export class PeopleComponent implements OnInit, OnDestroy {
    
    followingUsersSubscription: Subscription;
    followingUsers: Subscription;
    
    constructor(
        private userService: UserService
    ) {}
    
    ngOnInit(){
        this.followingUsersSubscription = this.userService.followees().subscribe(json => this.followingUsers = json.data);
    }
    
    ngOnDestroy(){
        this.followingUsersSubscription.unsubscribe();
    }
    
    onClick(follower: any) {
        
    }
}
