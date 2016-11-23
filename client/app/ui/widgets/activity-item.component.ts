import {Component, Input} from "@angular/core";
import {Activity} from "../../models/activity";

@Component({
	templateUrl: './activity-item.component.html',
	styleUrls: ['./activity-item.component.scss'],
	selector: 'activity-item'
})
export class ActivityItemComponent {
	
	@Input() activity: Activity = null;
	
	constructor() {}
}
