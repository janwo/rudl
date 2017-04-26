import {Component, OnDestroy, OnInit} from "@angular/core";
import {EmptyState} from '../../widgets/state/empty.component';

@Component({
    templateUrl: 'expedition-forbidden.component.html',
    styleUrls: ['expedition-forbidden.component.scss']
})
export class ExpeditionForbiddenComponent {
	
	constructor() {}
	
	unapprovedState: EmptyState = {
		title: 'You are not approved',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t get you in there. You have to get approved!'
	};
}
