import {
    Component, OnInit, OnDestroy, ViewChild, AfterViewInit, HostBinding, transition, animate,
    style, state, trigger
} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Activity} from "../models/activity";
import {ButtonStyles} from "./widgets/styled-button.component";
import {ModalComponent} from "./widgets/modal.component";
import {ActivityService} from "../services/activity.service";
import {TabItem} from "./widgets/tab-menu.component";
import {FanComponent} from "./widgets/fan.component";

@Component({
    templateUrl: './event.component.html',
    styleUrls: ['./event.component.scss']
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
