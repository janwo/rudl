import {Component, Input} from "@angular/core";
import {List} from "../../models/list";

@Component({
	templateUrl: './list-item.component.html',
	styleUrls: ['./list-item.component.scss'],
	selector: 'list-item'
})
export class ListItemComponent {
	
	@Input() list: List = null;
	@Input() highlight: string;
}
