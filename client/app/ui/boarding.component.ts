import {
    Component, OnInit, OnDestroy, ViewChild, AfterViewInit, HostBinding, transition, animate,
    style, state, trigger
} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Activity} from "../models/activity";
import {ButtonStyles} from "./widgets/styled-button.component";
import {ModalComponent} from "./widgets/modal.component";
import {ActivityService} from "../services/activity.service";
import {TabItem} from "./widgets/tab-menu.component";
import {FanComponent} from "./widgets/fan.component";
import {UserService} from "../services/user.service";
import {DomSanitizer, SafeStyle} from "@angular/platform-browser";

@Component({
    templateUrl: './boarding.component.html',
    styleUrls: ['./boarding.component.scss'],
	animations: [
		trigger('fadeIn', [
			transition(':enter', [
				style({
					opacity: 0,
					transform: 'scale(0.75)'
				}),
				animate('0.3s 1s', style({
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
    grantedPermission: boolean;
	itemTransformation: SafeStyle;
	locationSubscription: Subscription;
    buttonStyle: ButtonStyles = ButtonStyles.default;
    
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
	    this.locationSubscription = this.userService.getCurrentPosition().subscribe(() => this.grantedPermission = true, (error: PositionError) => {
	    	this.grantedPermission = false;
	    	switch(error.code) {
			    case error.PERMISSION_DENIED:
			    	console.log('https://support.google.com/chrome/answer/142065?hl=en');
		    }
	    });
    }
    
    grantPermission(): void {
    	this.userService.requestPositionUpdates();
    }
    
    finishBoarding(): void {
    	this.userService.updateBoarding(true).subscribe(() => {
    		this.router.navigate(['/']);
	    });
    }
    
    ngOnDestroy(){
    	this.locationSubscription.unsubscribe()
    }
}
