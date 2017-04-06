import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {UserService, UserStatus} from "../../../services/user.service";

@Component({
    templateUrl: 'landing.component.html',
    styleUrls: ['landing.component.scss']
})
export class LandingComponent implements OnInit {
    
    showLogin: boolean;
    
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService
    ) {}
    
    openExternalLink(link: string): void {
        window.open(link);
    }
    
    ngOnInit(): void {
        this.showLogin = this.route.snapshot.data['login'];
        this.userService.getAuthenticatedUserObservable().subscribe(((user: UserStatus) => {
            if(user.loggedIn) this.router.navigate(['/']);
        }));
    }
}