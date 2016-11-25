import {Component, Input} from "@angular/core";
import {List} from "../../models/list";

@Component({
	templateUrl: './list-wrapper.component.html',
	styleUrls: ['./list-wrapper.component.scss'],
	selector: 'list-wrapper'
})
export class ListWrapperComponent {
	
	@Input() twoColumnLayout: boolean;
	
	constructor() {}
}
