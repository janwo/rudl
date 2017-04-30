import {Component, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Activity} from "../../../models/activity";
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {ModalComponent} from "../../widgets/modal/modal.component";
import {ActivityService} from "../../../services/activity.service";

@Component({
    templateUrl: 'activity.component.html',
    styleUrls: ['activity.component.scss']
})
export class ActivityComponent implements OnInit {
	
    activity: Activity;
    pendingFollowRequest: boolean = false;
    buttonStyleDefault: ButtonStyles = ButtonStyles.outlined;
    buttonStyleActivated: ButtonStyles = ButtonStyles.filled;
    @ViewChild('unfollowModal') unfollowModal: ModalComponent;
	
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
        private route: ActivatedRoute,
        private router: Router
    ) {}
    
    ngOnInit(){
        // Define changed params subscription.
	    this.route.data.subscribe((data: { activity: Activity }) => this.activity = data.activity);
    }
    
    onToggleFollow(checkOwnerStatus: boolean = false): void {
        if(checkOwnerStatus && this.activity.relations.isOwned) {
            this.unfollowModal.open();
            return;
        }
        
        this.pendingFollowRequest = true;
        let obs = this.activity.relations.isFollowed ? this.activityService.unfollow(this.activity.id) : this.activityService.follow(this.activity.id);
        obs.subscribe((updatedActivity: Activity) => {
            this.pendingFollowRequest = false;
            
            // Set updated list.
            if(updatedActivity) {
                this.activity = updatedActivity;
                return;
            }
    
            // Show delete message.
            this.router.navigate(['/rudel/deleted-message']);
        });
    }
}
