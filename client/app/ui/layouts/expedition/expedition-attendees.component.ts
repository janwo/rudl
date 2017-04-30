import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Activity} from "../../../models/activity";
import {ActivityService} from "../../../services/activity.service";
import {User} from "../../../models/user";
import {Expedition} from '../../../models/expedition';
import {EmptyState} from '../../widgets/state/empty.component';
import {ExpeditionService} from '../../../services/expedition.service';

@Component({
    templateUrl: 'expedition-attendees.component.html',
    styleUrls: ['expedition-attendees.component.scss']
})
export class ExpeditionAttendeesComponent implements OnInit, OnDestroy {
	
	expedition: Expedition;
	expeditionSubscription: Subscription;
	attendees: User[];
	unapprovedState: EmptyState = {
		title: 'You are not approved',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t get you in there. You have to get approved!'
	};
	
	constructor(
		private expeditionService: ExpeditionService,
		private route: ActivatedRoute
	) {}
	
	ngOnInit(){
		// Define changed params subscription.
		/*
		this.expeditionSubscription = this.route.parent.data.flatMap((data: { expedition: Expedition }) => {
			this.expedition = data.expedition;
			return this.expeditionService...
		}).subscribe((attendees: User[]) => {
			this.attendees = attendees;
		});
	    */
	}
	
	ngOnDestroy(): void {
		//this.expeditionSubscription.unsubscribe();
	}
}
