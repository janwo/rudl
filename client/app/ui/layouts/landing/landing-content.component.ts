import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService, UserStatus} from '../../../services/user.service';
import {Title} from '@angular/platform-browser';

@Component({
	templateUrl: 'landing-content.component.html',
	styleUrls: ['landing-content.component.scss']
})
export class LandingContentComponent implements OnInit {

    constructor(
        private router: Router,
        private title: Title,
        private userService: UserService) {}

    ngOnInit(): void {
        this.title.setTitle('Entdecke den Puls deiner Stadt! | rudl.me');

        this.userService.getAuthenticatedUserObservable().subscribe(((user: UserStatus) => {
            if (user.loggedIn) this.router.navigate(['/explore'], {
                replaceUrl: true
            });
        }));
    }
}