import {Component, Input, OnInit} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import {NavigationEnd, Router, UrlTree} from '@angular/router';

@Component({
	templateUrl: 'fan.component.html',
	styleUrls: ['fan.component.scss'],
	selector: 'fan',
	animations: [
		trigger('backgroundVisibility', [
			transition(':enter', [
				style({
					opacity: 0
				}),
				animate('300ms', style({
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
		trigger('contentVisibility', [
			transition(':enter', [
				style({
					opacity: 0,
					transform: 'translateY(4rem)'
				}),
				animate('300ms 200ms', style({
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
export class FanComponent implements OnInit {
	
	@Input() expandedUrl: UrlTree = null;
	expanded: boolean = false;
	
	constructor(private router: Router) {}
	
	ngOnInit(): void {
		this.router.events.filter(event => event instanceof NavigationEnd).subscribe(event => {
			this.expanded = this.expandedUrl && this.router.isActive(this.expandedUrl, false);
		});
	}
}
