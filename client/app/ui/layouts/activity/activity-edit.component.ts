import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Activity} from "../../../models/activity";
import {ActivityService} from "../../../services/activity.service";
import {ExpeditionService} from "../../../services/expedition.service";

@Component({
    templateUrl: 'activity-edit.component.html',
    styleUrls: ['activity-edit.component.scss']
})
export class ActivityEditComponent implements OnInit {
	
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
