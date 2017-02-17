import {Component, OnInit, OnDestroy, ViewChild} from "@angular/core";
import {Subscription, Subject} from "rxjs";
import {ActivatedRoute, Params} from "@angular/router";
import {Activity} from "../models/activity";
import {ButtonStyles} from "./widgets/styled-button.component";
import {ModalComponent} from "./widgets/modal.component";
import {ActivityService} from "../services/activity.service";
import {ListService} from "../services/list.service";

@Component({
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit, OnDestroy {
    
    activity: Activity;
    activitySubscription: Subscription;
    pendingFollowRequest: boolean = false;
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleActivated: ButtonStyles = ButtonStyles.minimalInverse;
    @ViewChild('unfollowModal') unfollowModal: ModalComponent;
    loadActivityLists: Subject<any> = new Subject();
    
    modalChoices = [{
        buttonStyle: ButtonStyles.default,
        text: 'Abbrechen',
        callback: () => this.unfollowModal.close()
    }, {
        buttonStyle: ButtonStyles.uncolored,
        text: 'Entfolgen',
        callback: () => {
            this.unfollowModal.close();
            this.onToggleFollow();
        }
    }];
    
    constructor(
        private activityService: ActivityService,
        private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
        // Get params.
        this.route.params.forEach((params: Params) => {
            // Get selected tab.
            let key = params['key'];
            
            // Create activity subscription.
            this.activitySubscription = this.activityService.get(key).subscribe(activity => this.activity = activity);
        });
        
    }
    
    ngOnDestroy(){
        this.activitySubscription.unsubscribe();
    }
    
    onToggleFollow(checkOwnerStatus: boolean = false): void {
        if(checkOwnerStatus && this.activity.relations.isOwned) {
            this.unfollowModal.open();
            return;
        }
        
        this.pendingFollowRequest = true;
        let obs = this.activity.relations.isFollowed ? this.activityService.unfollow(this.activity.id) : this.activityService.follow(this.activity.id);
        obs.do((updatedActivity: Activity) => {
            this.activity = updatedActivity;
            this.pendingFollowRequest = false;
        }).subscribe();
    }
}
