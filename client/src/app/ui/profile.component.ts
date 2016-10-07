import {Component, OnInit, OnDestroy} from "@angular/core";
import {UserService, User} from "../user.service";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params} from "@angular/router";
import {JsonResponse} from "../data.service";

@Component({
    template: require('./profile.component.html'),
    styles: [require('./profile.component.scss')]
})
export class ProfileComponent implements OnInit, OnDestroy {
    
    user: User;
    userSubscription: Subscription;
    
    constructor(
        private route: ActivatedRoute,
        private userService: UserService
    ) {}
    
    ngOnInit(): void{
        this.route.params.forEach((params: Params) => {
            let username = params['username'];
            this.userSubscription = this.userService.getUser(username).subscribe((response: JsonResponse) => this.user = response.data);
        });
    }
    
    ngOnDestroy(): void{
        this.userSubscription.unsubscribe();
    }
    
    onToggleFollow(): void {
        if(this.user.relation.followee)
            this.userService.deleteFollowee(this.user.username).subscribe(console.log);
        else
            this.userService.addFollowee(this.user.username).subscribe(console.log);
    }
}
