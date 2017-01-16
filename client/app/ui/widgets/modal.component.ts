import {Component, trigger, transition, style, animate} from "@angular/core";

@Component({
	templateUrl: './modal.component.html',
	styleUrls: ['./modal.component.scss'],
	selector: 'modal',
	animations: [
		trigger('background', [
			transition('void => *', [
				style({
					opacity: 0
				}),
				animate('300ms 100ms', style({
					opacity: 1
				}))
			]),
			transition('* => void', [
				style({
					opacity: 1
				}),
				animate('300ms 200ms', style({
					opacity: 0
				}))
			])
		]),
		trigger('modal', [
			transition('void => *', [
				style({
					opacity: 0,
					transform: 'translateY(4rem)'
				}),
				animate('300ms', style({
					opacity: 1,
					transform: 'translateY(0rem)'
				}))
			]),
			transition('* => void', [
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
	
	private visible: boolean = false;

	open(){
		this.visible = true;
	}
	
	close() {
		this.visible = false;
	}
}
