import {Component, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {EmptyState} from "../../widgets/state/empty.component";
import {Expedition} from "../../../models/expedition";
import * as moment from "moment";
import {UserService} from "../../../services/user.service";

@Component({
    templateUrl: 'expedition.component.html',
    styleUrls: ['expedition.component.scss']
})
export class ExpeditionComponent implements OnInit {
    
    expedition: Expedition;
	formattedDate: string;
	formattedLocation: string;
	formattedAwaitingApproval: string;
	unapprovedState: EmptyState = {
		title: 'You are not approved',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t get you in there. You have to get approved!'
	};
    
    constructor(
	    private route: ActivatedRoute,
	    private userService: UserService
    ) {}
    
    ngOnInit(){
        // Define changed params subscription.
        this.route.data.subscribe((data: { expedition: Expedition }) => {
            this.expedition = data.expedition;
            
	        let humanizedDate = moment.duration(moment().diff(this.expedition.date)).humanize();
	        this.formattedDate = this.expedition.fuzzyTime ? `in about ${humanizedDate}` : `in ${humanizedDate}`;
	
	        let distance = this.userService.getUsersDistance(this.expedition.location);
	        distance = distance <= 10000 ? Math.ceil(distance / 100) / 10 : Math.ceil(distance / 1000);
	        this.formattedLocation = this.expedition.needsApproval && !this.expedition.relations.isApproved ? `ca. ${distance} km` : `${distance} km`;
        });
    }
	
	
	 // Show delete message.
	 // this.router.navigate(['/lists/deleted-message']);
	 
}
