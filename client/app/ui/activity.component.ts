import {
    Component, OnInit, OnDestroy, ViewChild
} from "@angular/core";
import {Subscription, Observable} from "rxjs";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Activity} from "../models/activity";
import {Event} from "../models/event";
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
        current: {
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
        },
        past: {
            icon: 'calendar-times-o',
            title: 'Bisherige Events',
            link: this.router.createUrlTree(['../past-events'], {
                relativeTo: this.route
            }),
            notification: false
        }
    };
    
    activity: Activity;
    pendingFollowRequest: boolean = false;
    currentEvents: Event[] = [];
    pastEvents: Event[] = [];
    nearbyEvents: Event[] = [];
    isLoading: boolean = false;
    paramsChangedSubscription: Subscription;
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleActivated: ButtonStyles = ButtonStyles.minimalInverse;
    @ViewChild('unfollowModal') unfollowModal: ModalComponent;
    
    emptyStates = {
        around: {
            title: 'That\'s sad',
            image: require('../../assets/boarding/radar.png'),
            description: 'We couldn\'t find any events around here. Create one and make your locals happy!'
        },
        past: {
            title: 'No past events',
            image: require('../../assets/boarding/radar.png'),
            description: 'You have no past events yet.'
        },
        current: {
            title: 'Start joining an event',
            image: require('../../assets/boarding/radar.png'),
            description: 'You haven\'t joined any event yet.'
        }
    };
    
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
        // Define changed params subscription.
        this.paramsChangedSubscription = this.route.params.distinctUntilChanged((x, y) => {
            // Only continue if any params changed.
            return x['activity'] == y['activity'] && x['tab'] == y['tab'];
        }).do(() => this.isLoading = true).flatMap(params => {
            // Skip activity retrieval, if id does not differ.
            if(this.activity && params['activity'] == this.activity.id) return Observable.of(params['tab']);
            
            // Get activity.
            return this.activityService.get(params['activity']).do((activity: Activity) => this.activity = activity).map(() => params['tab']);
        }).subscribe((tab: string) => {
            // Map to tab specific resources.
            switch (tab) {
                case 'your-events':
                    this.tab = this.tabItems['current'];
                    this.eventService.by('me', this.activity.id).subscribe((events: Event[]) => {
                        this.currentEvents = events;
                        this.isLoading = false;
                    });
                    break;
                case 'nearby-events':
                    this.tab = this.tabItems['around'];
                    this.eventService.nearby(this.activity.id).subscribe((events: Event[]) => {
                        this.nearbyEvents = events;
                        this.isLoading = false;
                    });
                    break;
                case 'past-events':
                    this.tab = this.tabItems['past'];
                    this.eventService.by('me', this.activity.id).subscribe((events: Event[]) => {
                        this.pastEvents = events;
                        this.isLoading = false;
                    });
                    break;
            }
        });
    }
    
    ngOnDestroy(){
        this.paramsChangedSubscription.unsubscribe();
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
