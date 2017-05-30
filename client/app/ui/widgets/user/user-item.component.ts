import {Component, Input, OnInit} from '@angular/core';
import {User} from '../../../models/user';

@Component({
	templateUrl: 'user-item.component.html',
	styleUrls: ['user-item.component.scss'],
	selector: 'user-item'
})
export class UserItemComponent implements OnInit {
	
	@Input() user: User = null;
	@Input() highlight: string = null;
	@Input() info: string;
	
	constructor() {}
	
	ngOnInit(): void {
		// Set default message?
		if(!this.info) {
			// Choose default message.
			if (!this.user.relations) {
				this.info = `This is you!`;
				return;
			}
			
			let choices = [
				`You have ${this.user.relations.mutualFollowers} mutual followers`,
				`You have ${this.user.relations.mutualFollowees} mutual followees`
			];
			this.info = choices[Math.trunc(choices.length * Math.random())];
		}
	}
}
