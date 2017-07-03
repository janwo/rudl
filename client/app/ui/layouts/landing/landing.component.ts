import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService, UserStatus} from '../../../services/user.service';
import {Title} from '@angular/platform-browser';

@Component({
	templateUrl: 'landing.component.html',
	styleUrls: ['landing.component.scss']
})
export class LandingComponent implements OnInit {
	
	constructor(private route: ActivatedRoute,
	            private router: Router,
	            title: Title,
	            private userService: UserService) {
			title.setTitle('rudl.me - Entdecke den Puls deiner Stadt!');
		}
	
	openExternalLink(link: string): void {
		window.open(link);
	}
	
	ngOnInit(): void {
		this.userService.getAuthenticatedUserObservable().subscribe(((user: UserStatus) => {
			if (user.loggedIn) this.router.navigate(['/']);
		}));
	}
}
