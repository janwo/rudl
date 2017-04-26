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
    templateUrl: 'expedition-details.component.html',
    styleUrls: ['expedition-details.component.scss']
})
export class ExpeditionDetailsComponent implements OnInit, OnDestroy {
	
	expedition: Expedition;
	expeditionSubscription: Subscription;
	attendees: User[];
	
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
