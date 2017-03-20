import {Component, OnInit, OnDestroy} from "@angular/core";
import {Subscription} from "rxjs";
import {EmptyState} from "../../widgets/state/empty.component";
import {EventService} from "../../../services/event.service";
import {ActivatedRoute} from "@angular/router";
import {Event} from "../../../models/event";

@Component({
	templateUrl: 'activity-user-events.component.html',
	styleUrls: ['activity-user-events.component.scss']
})
export class ActivityUserEventsComponent implements OnInit, OnDestroy {
	
	eventSubscription: Subscription;
	events: Event[] = null;
	emptyState: EmptyState = {
		title: 'Start joining an event',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'You haven\'t joined any event yet.'
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
