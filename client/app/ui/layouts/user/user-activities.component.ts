import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {ActivityService} from "../../../services/activity.service";
import {Activity} from "../../../models/activity";
import {EmptyState} from "../../widgets/state/empty.component";

@Component({
    templateUrl: 'user-activities.component.html',
    styleUrls: ['user-activities.component.scss']
})
export class UserActivitiesComponent implements OnInit, OnDestroy {
	
	activitySubscription: Subscription;
	activities: Activity[] = null;
	emptyState: EmptyState = {
		title: 'There are no Rudels',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'Why not search for new Rudels that you like?'
	};
	
	constructor(
		private activityService: ActivityService,
		private route: ActivatedRoute
	) {}
	
	ngOnInit() {
		this.activitySubscription = this.route.parent.params.map(params => params['username']).do(() => {
			this.activities = null;
		}).flatMap(username => {
			return this.activityService.by(username);
		}).subscribe((activities: Activity[]) => {
			this.activities = activities;
		});
	}
	
	ngOnDestroy() {
		this.activitySubscription.unsubscribe();
	}
}
