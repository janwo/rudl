import {Component, Input} from '@angular/core';

@Component({
	templateUrl: 'item-wrapper.component.html',
	styleUrls: ['item-wrapper.component.scss'],
	selector: 'item-wrapper'
})
export class ItemWrapperComponent {
	
	@Input() columns: number = 1;
	@Input() noMargins: boolean = false;
	
	constructor() {}
}
