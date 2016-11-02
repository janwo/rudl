import {Component, Input} from "@angular/core";
import {List} from "../../user.service";

@Component({
	template: require('./list-item.component.html'),
	styles: [require('./list-item.component.scss')],
	selector: 'list-item'
})
export class ListItemComponent {
	
	@Input() list: List = null;
	
	constructor() {}
}
