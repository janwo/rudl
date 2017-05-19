import {Component, Input} from "@angular/core";
import {Rudel} from "../../../models/rudel";

@Component({
	templateUrl: 'rudel-item.component.html',
	styleUrls: ['rudel-item.component.scss'],
	selector: 'rudel-item'
})
export class RudelItemComponent {
	
	@Input() rudel: Rudel;
	@Input() highlight: string;
}
