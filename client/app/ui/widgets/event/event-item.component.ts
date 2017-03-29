import {Component, Input} from "@angular/core";
import {Event} from "../../../models/event";

@Component({
	templateUrl: 'event-item.component.html',
	styleUrls: ['event-item.component.scss'],
	selector: 'event-item'
})
export class EventItemComponent {
	
	@Input() event: Event;
}
