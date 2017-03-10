import {
	Component, Input, OnInit, trigger, transition, style, animate
} from "@angular/core";
import {SafeStyle, DomSanitizer} from "@angular/platform-browser";

@Component({
    templateUrl: './loading.component.html',
    styleUrls: ['./loading.component.scss'],
	selector: 'loading',
	animations: [
		trigger('fadeIn', [
			transition(':enter', [
				style({
					opacity: 0,
					transform: 'scale(0.75)'
				}),
				animate('1s ease-in', style({
					opacity: 1,
					transform: 'scale(1)'
				}))
			]),
			transition(':leave', [
				style({
					opacity: 1,
					transform: 'scale(1)'
				}),
				animate('1s ease-in', style({
					opacity: 0,
					transform: 'scale(0.75)'
				}))
			])
		]),
		trigger('slideIn', [
			transition(':enter', [
				style({
					opacity: 0,
					transform: 'translateY(1rem)'
				}),
				animate('1s ease-in', style({
					opacity: 1,
					transform: 'translateY(0)'
				}))
			]),
			transition(':leave', [
				style({
					opacity: 1,
					transform: 'translateY(0)'
				}),
				animate('1s ease-in', style({
					opacity: 1,
					transform: 'translateY(1rem)'
				}))
			])
		])
	]
})
export class LoadingComponent implements OnInit {
    
    constructor(
    	private sanitizer: DomSanitizer
    ) {}
    
    ngOnInit(): void {
		if(this.emptyState) this.backgroundImageStyle = this.sanitizer.bypassSecurityTrustStyle(`url(${this.emptyState.image})`);
	}
    
    @Input() emptyState: EmptyState;
	@Input() isLoading: boolean = false;
    backgroundImageStyle: SafeStyle;
}

export interface EmptyState {
	title: string;
	image: string;
	description: string;
}
