import {Component, HostBinding, Input} from '@angular/core';
import {User} from '../../../models/user';

@Component({
	templateUrl: 'user-avatar.component.html',
	styleUrls: ['user-avatar.component.scss'],
	selector: 'user-avatar'
})
export class UserAvatarComponent {
	
	@HostBinding('class.loading') @Input() loading: boolean;
	@Input() user: User;
	@Input() size: 'small' | 'medium' | 'large' = 'small';
}
