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
	relation: string;
	
	constructor() {}
	
	ngOnInit(): void {
		// Set custom message?
		if (!this.user.relations) {
			this.relation = `This is you!`;
			return;
		}
		
		// Choose default message.
		let choices = [
			`You have ${this.user.relations.mutualFollowers} mutual followers`,
			`You have ${this.user.relations.mutualFollowees} mutual followees`
		];
		this.relation = choices[Math.trunc(choices.length * Math.random())];
	}
}
