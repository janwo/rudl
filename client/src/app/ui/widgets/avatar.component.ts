import {Input, Component} from "@angular/core";
import {User} from "../../user.service";

@Component({
	template: require('./avatar.component.html'),
	styles: [require('./avatar.component.scss')],
	selector: 'avatar'
})
export class AvatarComponent {
	
	@Input() user: User = null;
}
