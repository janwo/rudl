import {Component, Input} from "@angular/core";
import {User} from "../../user.service";

@Component({
	template: require('./people-item.component.html'),
	styles: [require('./people-item.component.scss')],
	selector: 'people-item'
})
export class PeopleItemComponent {
	
	@Input() user: User = null;
	
	constructor() {}
}
