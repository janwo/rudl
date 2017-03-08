import {Component, Input} from "@angular/core";

@Component({
	templateUrl: './event-item.component.html',
	styleUrls: ['./event-item.component.scss'],
	selector: 'event-item'
})
export class EventItemComponent {
	
	@Input() event: Event = null;
}
