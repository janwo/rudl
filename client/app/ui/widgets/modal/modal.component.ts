import {Component, EventEmitter, Input, Output} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';

@Component({
	templateUrl: 'modal.component.html',
	styleUrls: ['modal.component.scss'],
	selector: 'modal',
	animations: [
		trigger('background', [
			transition(':enter', [
				style({
					opacity: 0
				}),
				animate('300ms 100ms', style({
					opacity: 1
				}))
			]),
			transition(':leave', [
				style({
					opacity: 1
				}),
				animate('300ms 200ms', style({
					opacity: 0
				}))
			])
		]),
		trigger('modal', [
			transition(':enter', [
				style({
					opacity: 0,
					transform: 'translateY(4rem)'
				}),
				animate('300ms', style({
					opacity: 1,
					transform: 'translateY(0rem)'
				}))
			]),
			transition(':leave', [
				style({
					opacity: 1,
					transform: 'translateY(0rem)'
				}),
				animate('300ms', style({
					opacity: 0,
					transform: 'translateY(4rem)'
				}))
			])
		])
	]
})
export class ModalComponent {
	
	@Input() title: string;
	@Output() onOpen: EventEmitter<any> = new EventEmitter();
	@Output() onOpened: EventEmitter<any> = new EventEmitter();
	@Output() onClose: EventEmitter<any> = new EventEmitter();
	@Output() onClosed: EventEmitter<any> = new EventEmitter();
	isVisible: boolean = false;
	
	open() {
		this.isVisible = true;
	}
	
	close() {
		this.isVisible = false;
	}
}
