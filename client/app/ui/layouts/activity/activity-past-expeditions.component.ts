import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Activity} from "../../../models/activity";
import {Expedition} from "../../../models/expedition";
import {ExpeditionService} from "../../../services/expedition.service";
import {EmptyState} from "../../widgets/state/empty.component";

@Component({
    templateUrl: 'activity-past-expeditions.component.html',
    styleUrls: ['activity-past-expeditions.component.scss']
})
export class ActivityPastExpeditionsComponent implements OnInit, OnDestroy {
	
    activity: Activity;
	expeditionSubscription: Subscription;
	expeditions: Expedition[];
	emptyState: EmptyState = {
		title: 'Newbie!',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t find any expeditions you attended to!'
	};
    
    constructor(
	    private expeditionService: ExpeditionService,
	    private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
        // Define changed params subscription.
	    this.expeditionSubscription = this.route.parent.data.flatMap((data: { activity: Activity }) => {
		    this.activity = data.activity;
		    return this.expeditionService.by('me', data.activity.id);
	    }).subscribe((expeditions: Expedition[]) => {
		    this.expeditions = expeditions;
	    });
    }
    
	ngOnDestroy(): void {
    	this.expeditionSubscription.unsubscribe();
	}
}
