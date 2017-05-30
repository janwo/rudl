import {Component, Input} from '@angular/core';
import {User} from '../../../models/user';

@Component({
	templateUrl: 'user-avatar.component.html',
	styleUrls: ['user-avatar.component.scss'],
	selector: 'user-avatar'
})
export class UserAvatarComponent {
	
	@Input() user: User;
}
