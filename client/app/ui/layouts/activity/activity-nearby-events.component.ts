import {Component, OnInit, OnDestroy} from "@angular/core";
import {Subscription} from "rxjs";
import {EmptyState} from "../../widgets/state/empty.component";
import {EventService} from "../../../services/event.service";
import {ActivatedRoute} from "@angular/router";
import {Event} from "../../../models/event";

@Component({
	templateUrl: 'activity-nearby-events.component.html',
	styleUrls: ['activity-nearby-events.component.scss']
})
export class ActivityNearbyEventsComponent implements OnInit, OnDestroy {
	
	eventSubscription: Subscription;
	events: Event[] = null;
	emptyState: EmptyState = {
		title: 'That\'s sad',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t find any events around here. Create one and make your locals happy!'
	};
	
	constructor(
		private eventService: EventService,
		private route: ActivatedRoute
	) {}
	
	ngOnInit() {
		this.eventSubscription = this.route.parent.params.map(params => params['activity']).do(() => {
			this.events = null;
		}).flatMap(activity => {
			return this.eventService.by('me', activity.id);
		}).subscribe((events: Event[]) => this.events = events);
	}
	
	ngOnDestroy() {
		this.eventSubscription.unsubscribe();
	}
}
