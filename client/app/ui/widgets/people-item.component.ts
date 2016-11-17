import {Component, Input} from "@angular/core";
import {User} from "../../models/user";

@Component({
	templateUrl: './people-item.component.html',
	styleUrls: ['./people-item.component.scss'],
	selector: 'people-item'
})
export class PeopleItemComponent {
	
	@Input() user: User = null;
	
	constructor() {}
}
