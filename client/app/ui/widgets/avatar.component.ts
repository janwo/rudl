import {Input, Component} from "@angular/core";
import {User} from "../../models/user";

@Component({
	templateUrl: './avatar.component.html',
	styleUrls: ['./avatar.component.scss'],
	selector: 'avatar'
})
export class AvatarComponent {
	
	@Input() user: User = null;
}
