import {Component, OnDestroy, OnInit, QueryList, ViewChild} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import {Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {UserService} from '../../../services/user.service';
import {Title} from '@angular/platform-browser';
import {CarouselComponent} from "../../widgets/wrapper/carousel.component";

@Component({
	templateUrl: 'boarding.component.html',
	styleUrls: ['boarding.component.scss'],
	animations: [
		trigger('fadeIn', [
			transition(':enter', [
				style({
					opacity: 0,
					transform: 'scale(0.75)'
				}),
				animate('0.3s 1s ease-in', style({
					opacity: 1,
					transform: 'scale(1)'
				}))
			])
		])
	]
})
export class BoardingComponent implements OnInit, OnDestroy {
	
	constructor(private userService: UserService,
	            private router: Router,
	            title: Title) {
		title.setTitle('rudl.me - Boarding'); //rudl.me - Boarding
	}
	
	carouselIndex: number = 0;
	permissionStatus: 'ungranted' | 'granting' | 'granted' | 'denied' = 'ungranted';
	locationSubscription: Subscription;
	ButtonStyles = ButtonStyles;
	
	ngOnInit() {
		// Subscribe to permissions.
		this.locationSubscription = this.userService.getCurrentPosition().subscribe(() => {
			this.permissionStatus = 'granted';
		}, error => {
			this.permissionStatus = 'denied';
		});
	}
	
	setCarouselIndex(index: number): void {
		this.carouselIndex = index;
	}
	
	grantPermission(): void {
		this.permissionStatus = 'granting';
		this.userService.resumePositionUpdates();
	}
	
	finishBoarding(): void {
		this.userService.updateBoarding(true).subscribe(() => {
			this.router.navigate(['/']);
		});
	}
	
	openHelpTopic() {
	
	}
	
	ngOnDestroy() {
		this.locationSubscription.unsubscribe();
	}
}
