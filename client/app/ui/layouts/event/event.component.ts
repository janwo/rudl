import {Component, OnInit, OnDestroy} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ActivityService} from "../../../services/activity.service";

@Component({
    templateUrl: 'event.component.html',
    styleUrls: ['event.component.scss']
})
export class EventComponent implements OnInit, OnDestroy {
    
    constructor(
        private activityService: ActivityService,
        private route: ActivatedRoute,
        private router: Router
    ) {}
    
    ngOnInit(){
        // Get params.
        this.route.params.forEach((params: Params) => {
            // Get selected tab.
            let key = params['key'];
            
       });
        
    }
    
    ngOnDestroy(){
    }
}
