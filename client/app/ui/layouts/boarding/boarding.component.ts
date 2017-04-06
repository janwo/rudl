import {Component, OnInit, OnDestroy} from "@angular/core";
import {trigger, transition, style, animate} from "@angular/animations";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {UserService} from "../../../services/user.service";
import {DomSanitizer, SafeStyle} from "@angular/platform-browser";

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
        private route: ActivatedRoute,
        private router: Router,
        private sanitizer: DomSanitizer
    ) {
	    // Sanitize style.
	    this.itemTransformation = this.sanitizer.bypassSecurityTrustStyle(`translateX(-${this.step * 100}%)`);
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
	itemTransformation: SafeStyle;
	locationSubscription: Subscription;
    ButtonStyles = ButtonStyles;
    
    ngOnInit(){
    	// Get params.
        this.route.params.forEach((params: Params) => {
        	let step = parseInt(params['step']) || 0;
        	
        	// Finish line?
	        if(step > this.steps.length) {
	        	
	        	//return;
	        }
        	
            // Get selected step.
            this.step = Math.min(Math.max(0, step), this.steps.length - 1);
            
            // Sanitize style.
	        this.itemTransformation = this.sanitizer.bypassSecurityTrustStyle(`translateX(-${this.step * 100}%)`);
        });
        
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
