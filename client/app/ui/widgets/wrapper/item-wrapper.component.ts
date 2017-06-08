import {Component, Input, Output} from '@angular/core';

@Component({
	templateUrl: 'item-wrapper.component.html',
	styleUrls: ['item-wrapper.component.scss'],
	selector: 'item-wrapper'
})
export class ItemWrapperComponent {
	
	@Input() columns: number = 1;
	@Input() margins: boolean = true;
	@Input() horizontal: boolean = false;
	@Output() scrollX: number = 0;
	@Output() scrollY: number = 0;
	
	onScroll(element: Element): void {
		this.scrollX = element.scrollWidth ? (element.scrollLeft + element.clientWidth) / element.scrollWidth : 1;
		this.scrollY = element.scrollHeight ? (element.scrollTop + element.clientHeight) / element.scrollHeight : 1;
	}
}
