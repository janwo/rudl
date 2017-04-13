import {Component, OnInit, OnDestroy} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {EmptyState} from "../../widgets/state/empty.component";
import {Expedition} from "../../../models/expedition";

@Component({
    templateUrl: 'expedition.component.html',
    styleUrls: ['expedition.component.scss']
})
export class ExpeditionComponent implements OnInit {
    
    expedition: Expedition;
	unapprovedState: EmptyState = {
		title: 'You are not approved',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t get you in there. You have to get approved!'
	};
    
    constructor(
        private route: ActivatedRoute,
    ) {}
    
    ngOnInit(){
        // Define changed params subscription.
        this.route.data.subscribe((data: { expedition: Expedition }) => {
            this.expedition = data.expedition;
        });
    }
}
