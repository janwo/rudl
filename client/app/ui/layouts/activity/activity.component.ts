import {Component, OnInit, OnDestroy, ViewChild, trigger, state, style, transition, animate} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params} from "@angular/router";
import {Activity} from "../../../models/activity";
import {ButtonStyles} from "../../widgets/controls/styled-button.component";
import {ModalComponent} from "../../widgets/modal/modal.component";
import {ActivityService} from "../../../services/activity.service";

@Component({
    templateUrl: 'activity.component.html',
    styleUrls: ['activity.component.scss'],
	animations: [
		trigger('container', [
			state('true', style({
				height: '*',
				opacity: 1
			})),
			state('false', style({
				height: 0,
				opacity: 0
			})),
			transition('1 => 0', animate('300ms')),
			transition('0 => 1', animate('300ms'))
		])
	]
})
export class ActivityComponent implements OnInit, OnDestroy {
	
    activity: Activity;
    pendingFollowRequest: boolean = false;
	expandedEventCreation: boolean = false;
    activitySubscription: Subscription;
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleActivated: ButtonStyles = ButtonStyles.minimalInverse;
    @ViewChild('unfollowModal') unfollowModal: ModalComponent;
	
    modalChoices = [{
        style: ButtonStyles.default,
        text: 'Abbrechen',
        callback: () => this.unfollowModal.close()
    }, {
	    style: ButtonStyles.uncolored,
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
        // Define changed params subscription.
        this.activitySubscription = this.route.params.distinctUntilChanged((x, y) => x['activity'] == y['activity']).flatMap((params: Params) => {
            return this.activityService.get(params['activity']);
        }).subscribe((activity: Activity) => this.activity = activity);
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
