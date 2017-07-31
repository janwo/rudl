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
	            private title: Title,
	            private userService: UserService) {}
	
	ngOnInit(): void {
		this.title.setTitle('Entdecke den Puls deiner Stadt! | rudl.me');

		this.userService.getAuthenticatedUserObservable().subscribe(((user: UserStatus) => {
			if (user.loggedIn) this.router.navigate(['/explore']);
		}));
	}
}
