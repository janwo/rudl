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
	@Input() style: UserItemStyles = UserItemStyles.list;
	
	constructor() {}
	
	ngOnInit(): void {
		// Set default message?
		if(!this.info) {
			// Choose default message.
			if (!this.user.relations) {
				this.info = `Das bist du!`;
				return;
			}
			
			let choices = [
				`Du hast ${this.user.relations.mutualLikers} gemeinsame Anhänger`,
				`Ihr beide folgt gemeinsam ${this.user.relations.mutualLikees} Nutzer`
			];
			this.info = choices[Math.trunc(choices.length * Math.random())];
		}
	}
	
	getStyleClass(): string {
		switch (this.style) {
			case UserItemStyles.list:
				return 'card list';
		}
	}
}

export enum UserItemStyles {
	list
}
