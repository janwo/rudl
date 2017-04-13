import {Component, OnInit, OnDestroy, ViewChild} from "@angular/core";
import {trigger, transition, style, animate, state} from "@angular/animations";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Activity} from "../../../models/activity";
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {ModalComponent} from "../../widgets/modal/modal.component";
import {ActivityService} from "../../../services/activity.service";
import {Expedition} from "../../../models/expedition";
import {ExpeditionService} from "../../../services/expedition.service";
import {EmptyState} from "../../widgets/state/empty.component";

@Component({
    templateUrl: 'activity.component.html',
    styleUrls: ['activity.component.scss'],
	animations: [
		trigger('expandVertically', [
			state('*', style({
				height: '*',
				opacity: 1
			})),
			state('void', style({
				height: 0,
				opacity: 0
			})),
			transition(':leave', animate('0.3s')),
			transition(':enter', animate('0.3s'))
		]),
		trigger('expandHorizontally', [
			state('1', style({
				width: '100%'
			})),
			state('0', style({
				width: '*'
			})),
			transition('1 => 0', animate('0.3s')),
			transition('0 => 1', animate('0.3s'))
		])
	]
})
export class ActivityComponent implements OnInit {
	
    activity: Activity;
    pendingFollowRequest: boolean = false;
	expandedEventCreation: boolean = false;
    buttonStyleDefault: ButtonStyles = ButtonStyles.outlined;
    buttonStyleActivated: ButtonStyles = ButtonStyles.filled;
    @ViewChild('unfollowModal') unfollowModal: ModalComponent;
	expeditionSubscription: Subscription;
	expeditions: Expedition[];
	selectedExpedition: Expedition;
	emptyState: EmptyState = {
		title: 'That\'s sad',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t find any expeditions around here. Create one and make your locals happy!'
	};
	
	
	modalChoices = [{
        style: ButtonStyles.filledInverse,
        text: 'Abbrechen',
        callback: () => this.unfollowModal.close()
    }, {
	    style: ButtonStyles.outlinedInverse,
        text: 'Entfolgen',
        callback: () => {
            this.unfollowModal.close();
            this.onToggleFollow();
        }
    }];
    
    constructor(
	    private activityService: ActivityService,
	    private expeditionService: ExpeditionService,
	    private router: Router,
        private route: ActivatedRoute
    ) {}
	
	selectExpedition(event: Event, expedition: Expedition) {
		event.preventDefault();
		event.stopPropagation();
		
		if(this.selectedExpedition.id == expedition.id) {
			this.router.navigate(['/expeditions', expedition.id]);
			return;
		}
		this.selectedExpedition = expedition;
	}
    
    ngOnInit(){
        // Define changed params subscription.
	    this.expeditionSubscription = this.route.data.flatMap((data: { activity: Activity }) => {
		    this.activity = data.activity;
		    return this.expeditionService.by('me', data.activity.id);
	    }).subscribe((expeditions: Expedition[]) => {
		    this.expeditions = expeditions;
		    if(this.expeditions.length) this.selectedExpedition = this.expeditions[0];
	    });
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
