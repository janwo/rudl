import {
    Component, OnInit, OnDestroy, ViewChild
} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Activity} from "../models/activity";
import {ButtonStyles} from "./widgets/styled-button.component";
import {ModalComponent} from "./widgets/modal.component";
import {ActivityService} from "../services/activity.service";
import {TabItem} from "./widgets/tab-menu.component";
import {EventService} from "../services/event.service";

@Component({
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit, OnDestroy {
    
    tab: TabItem;
    tabItems: {[key: string]: TabItem} = {
        create: {
            icon: 'calendar-plus-o',
            title: 'Neues Event',
            link: this.router.createUrlTree(['../create-event'], {
                relativeTo: this.route
            }),
            notification: false
        },
        attending: {
            icon: 'calendar-check-o',
            title: 'Deine Events',
            link: this.router.createUrlTree(['../your-events'], {
                relativeTo: this.route
            }),
            notification: false
        },
        around: {
            icon: 'compass',
            title: 'Nahe Events',
            link: this.router.createUrlTree(['../nearby-events'], {
                relativeTo: this.route
            }),
            notification: false
        }
    };
    
    activity: Activity;
    activitySubscription: Subscription;
    nearbyEventsSubscription: Subscription;
    pendingFollowRequest: boolean = false;
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleActivated: ButtonStyles = ButtonStyles.minimalInverse;
    @ViewChild('unfollowModal') unfollowModal: ModalComponent;
    
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
        private eventService: EventService,
        private activityService: ActivityService,
        private route: ActivatedRoute,
        private router: Router
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
        //this.nearbyEventsSubscription.unsubscribe();
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
