import {Component, Input, OnInit} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';

@Component({
	templateUrl: 'empty.component.html',
	styleUrls: ['empty.component.scss'],
	selector: 'empty',
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
export class EmptyComponent implements OnInit {
	
	@Input() emptyState: EmptyState;
	backgroundImageStyle: SafeStyle;
	
	constructor(private sanitizer: DomSanitizer) {}
	
	ngOnInit(): void {
		this.backgroundImageStyle = this.sanitizer.bypassSecurityTrustStyle(`url(${this.emptyState.image})`);
	}
}

export interface EmptyState {
	title: string;
	image: string;
	description: string;
}
