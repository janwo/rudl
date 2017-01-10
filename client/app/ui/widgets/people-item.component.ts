import {Component, Input, OnInit} from "@angular/core";
import {User} from "../../models/user";

@Component({
	templateUrl: './people-item.component.html',
	styleUrls: ['./people-item.component.scss'],
	selector: 'people-item'
})
export class PeopleItemComponent implements OnInit {
	
	@Input() user: User = null;
	@Input() highlight: string = null;
	relation: string;
	
	constructor() {}
	
	ngOnInit(): void {
		// Set custom message?
		if(!this.user.relations) {
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
