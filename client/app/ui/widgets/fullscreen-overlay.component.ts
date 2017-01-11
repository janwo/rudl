import {Component, trigger, style, transition, animate, Output, EventEmitter, Injectable} from "@angular/core";

@Injectable()
export class FullScreenOverlayService {
	public expandState: boolean = false;
	
	public hideOverlay() {
		this.expandState = false;
	}
	
	public toggleOverlay(){
		this.expandState = !this.expandState;
	}
	
	public showOverlay(){
		this.expandState = true;
	};
}

@Component({
	templateUrl: './fullscreen-overlay.component.html',
	styleUrls: ['./fullscreen-overlay.component.scss'],
	selector: 'fullscreen-overlay',
	animations: [
		trigger('backgroundVisibility', [
			transition('void => *', [
				style({
					opacity: 0
				}),
				animate('300ms', style({
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
		trigger('contentVisibility', [
			transition('void => *', [
				style({
					opacity: 0,
					transform: 'translateY(4rem)'
				}),
				animate('300ms 200ms', style({
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
	],
	providers: [
		FullScreenOverlayService
	]
})
export class FullScreenOverlayComponent {
	@Output() onExpanded = new EventEmitter<void>();
	
	constructor(public service: FullScreenOverlayService) {}
}
