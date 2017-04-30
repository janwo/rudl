import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Activity} from "../../../models/activity";
import {List} from "../../../models/list";
import {ListService} from "../../../services/list.service";
import {EmptyState} from "../../widgets/state/empty.component";

@Component({
    templateUrl: 'list-activities.component.html',
    styleUrls: ['list-activities.component.scss']
})
export class ListActivitiesComponent implements OnInit, OnDestroy {
	
	activitiesSubscription: Subscription;
    list: List;
    activities: Activity[] = null;
	emptyState: EmptyState = {
		title: 'List is empty',
		image: require('..//../../../assets/boarding/radar.png'),
		description: 'There are no rudels in the list yet.'
	};
    
    constructor(
	    private listService: ListService,
        private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
	    // Define changed params subscription.
	    this.activitiesSubscription = this.route.parent.data.flatMap((data: { list: List }) => {
		    this.list = data.list;
		    return this.listService.activities(data.list.id);
	    }).subscribe((activities: Activity[]) => this.activities = activities);
    }
    
	ngOnDestroy(): void {
    	this.activitiesSubscription.unsubscribe();
	}
}
