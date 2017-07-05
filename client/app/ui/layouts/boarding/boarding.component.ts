import {Component, OnDestroy, OnInit, QueryList, ViewChild} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import {Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {UserService} from '../../../services/user.service';
import {Title} from '@angular/platform-browser';
import {Ng2DeviceService } from "ng2-device-detector";
import {Observable} from "rxjs/Observable";

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
export class BoardingComponent implements OnDestroy, OnInit {

    constructor(private userService: UserService,
	            private router: Router,
                private deviceService: Ng2DeviceService,
	            title: Title) {
		title.setTitle('rudl.me - Boarding'); //rudl.me - Boarding
	}
	
	carouselIndex: number = 0;
    permissionStatus: 'ungranted' | 'granting' | 'granted' | 'denied' = 'ungranted';
	locationSubscription: Subscription;
    navigationButtonStyle = ButtonStyles.filled;
    permissionButtonStyle = ButtonStyles.filledShadowed;
    helpButtonStyle = ButtonStyles.filledInverseShadowed;

    ngOnInit(): void {
        // Subscribe to permissions.
        this.locationSubscription = this.userService.getCurrentPosition().subscribe(location => {
            this.permissionStatus = location ? 'granted' : 'denied';
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

	openHelpLink(): void {
	    let link = this.getHelpLink();
	    if(link) window.open(link);
    }
	
	getHelpLink(): string {
	    let deviceInfo = this.deviceService.getDeviceInfo();
	    let isMobile = this.deviceService.isMobile();
	    let language = this.userService.getAuthenticatedUser().user.languages[0];
	    switch(deviceInfo.browser) {
            case 'chrome':
                let platform = 'Android';
                if(deviceInfo.os == 'ios') platform = 'iOS';
                if(!isMobile) platform = 'Desktop';
                return `https://support.google.com/chrome/answer/142065?co=GENIE.Platform%3D${platform}&hl=${language}`;

            case 'safari':
                let id = isMobile ? 'HT201357' : 'HT5403';
                return `https://support.apple.com/${language}-${language}/${id}`;

            case 'firefox':
                switch(deviceInfo.os) {
                    case 'android':
                        switch (language) {
                            case 'de':
                                return `https://support.mozilla.org/de/kb/mozilla-standortdienst-location-service-verbessern`;

                            case 'es':
                                return`https://support.mozilla.org/es/kb/mejora-los-servicios-de-localizacion-de-mozilla-ha`;

                            case 'fr':
                                return `https://support.mozilla.org/fr/kb/ameliorer-le-service-de-localisation-de-mozilla-en`;

                            default:
                                return `https://support.mozilla.org/en-US/kb/improve-mozilla-location-services-turning-location`;
                        }

                    default:
                        return null;
                }

            case 'windows':
                return `https://privacy.microsoft.com/en-us/windows-10-location-and-privacy`;

            default:
                return null;
        }
	}
	
	ngOnDestroy() {
		this.locationSubscription.unsubscribe();
	}
}
