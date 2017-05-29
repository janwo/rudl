import {Component, OnDestroy, OnInit} from "@angular/core";
import {animate, style, transition, trigger} from "@angular/animations";
import {Subscription} from "rxjs";
import {Router} from "@angular/router";
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {UserService} from "../../../services/user.service";
import {Meta, Title} from '@angular/platform-browser';

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
 
	constructor(
		private userService: UserService,
		private router: Router,
		title: Title
	) {
		title.setTitle('rudl.me - Boarding in Progress');
	}
    
    step: number = 0;
    steps: string[] = [
    	'Welcome to rudl',
        'Find Rudels',
        'Create Events',
        'Meet People',
        'Grant Permissions'
    ];
	permissionStatus: 'ungranted' | 'granting' | 'granted' | 'denied' = 'ungranted';
	locationSubscription: Subscription;
    ButtonStyles = ButtonStyles;
    
    ngOnInit(){
	    // Subscribe to permissions.
	    this.locationSubscription = this.userService.getCurrentPosition().subscribe(() => {
	    	this.permissionStatus = 'granted'
	    }, error => {
		    this.permissionStatus = 'denied';
	    });
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
    
    ngOnDestroy(){
    	this.locationSubscription.unsubscribe()
    }
}
