import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Activity} from "../../../models/activity";
import {ActivityService} from "../../../services/activity.service";
import {User} from "../../../models/user";

@Component({
    templateUrl: 'activity-followers.component.html',
    styleUrls: ['activity-followers.component.scss']
})
export class ActivityFollowersComponent implements OnInit, OnDestroy {
	
	followers: User[];
	followersSubscription: Subscription;
    activity: Activity;
    
    constructor(
	    private activityService: ActivityService,
        private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
	    // Define changed params subscription.
	    this.followersSubscription = this.route.parent.data.flatMap((data: { activity: Activity }) => {
		    this.activity = data.activity;
		    return this.activityService.followers(data.activity.id);
	    }).subscribe((followers: User[]) => {
		    this.followers = followers;
	    });
    }
    
	ngOnDestroy(): void {
    	this.followersSubscription.unsubscribe();
	}
}
