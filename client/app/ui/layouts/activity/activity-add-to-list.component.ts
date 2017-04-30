import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Activity} from "../../../models/activity";
import {ActivityService} from "../../../services/activity.service";
import {ExpeditionService} from "../../../services/expedition.service";

@Component({
    templateUrl: 'activity-add-to-list.component.html',
    styleUrls: ['activity-add-to-list.component.scss']
})
export class ActivityAddToListComponent implements OnInit {
	
    activity: Activity;
    
    constructor(
	    private activityService: ActivityService,
	    private expeditionService: ExpeditionService,
	    private router: Router,
        private route: ActivatedRoute
    ) {}
	
    ngOnInit(){
    }
}
