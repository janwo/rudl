import {Component, Input} from '@angular/core';
import {Rudel} from '../../../models/rudel';

@Component({
	templateUrl: 'rudel-item.component.html',
	styleUrls: ['rudel-item.component.scss'],
	selector: 'rudel-item'
})
export class RudelItemComponent {
	
	@Input() rudel: Rudel;
	@Input() highlight: string;
	@Input() style: RudelItemStyles = RudelItemStyles.list;
	
	getStyleClass(): string {
		switch (this.style) {
			case RudelItemStyles.block:
				return 'card block';
				
			case RudelItemStyles.list:
				return 'card list';
		}
	}
}

export enum RudelItemStyles {
	list,
	block
}
