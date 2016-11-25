import {Component, OnInit, OnDestroy} from "@angular/core";
import {UserService} from "../services/user.service";
import {Subscription, Observable} from "rxjs";
import {List} from "../models/list";
import {ActivatedRoute, Params} from "@angular/router";
import {Activity} from "../models/activity";
import {ButtonStyles} from "./widgets/styled-button.component";

@Component({
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
    
    list: List;
    activities: Activity[];
    listSubscription: Subscription;
    pendingFollowRequest: boolean = false;
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleFollowing: ButtonStyles = ButtonStyles.minimalInverse;
    
    constructor(
        private userService: UserService,
        private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
        // Get params.
        this.route.params.forEach((params: Params) => {
            // Get selected tab.
            let key = params['key'];
    
            this.listSubscription = Observable.zip(
                this.userService.list(key),
                this.userService.activities(key),
                (list: List, activities: Activity[]) => {
                    this.list = list;
                    this.activities = activities;
                }
            ).subscribe();
        });
    }
    
    ngOnDestroy(){
        this.listSubscription.unsubscribe();
    }
    
    onToggleFollow(): void {
        this.pendingFollowRequest = true;
        let obs = this.list.relations.following ? this.userService.unfollowList(this.list.id) : this.userService.followList(this.list.id);
        obs.do((updatedList: List) => {
            this.list = updatedList;
            this.pendingFollowRequest = false;
        }).subscribe();
    }
}
