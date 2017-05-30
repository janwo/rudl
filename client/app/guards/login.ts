import {CanActivate, Router} from '@angular/router';
import {Injectable} from '@angular/core';
import {UserService, UserStatus} from '../services/user.service';
import {Observable} from 'rxjs';

@Injectable()
export class LoginGuard implements CanActivate {
	
	constructor(private userService: UserService,
	            private router: Router) {}
	
	canActivate(): Observable<boolean> {
		return this.userService.getAuthenticatedUserObservable().map((userStatus: UserStatus) => {
			if (!userStatus.loggedIn) {
				let loginUrl = this.router.createUrlTree(['/sign_up']);
				if (!this.router.isActive(loginUrl, false)) this.router.navigateByUrl(loginUrl);
			}
			
			return userStatus.loggedIn;
		});
	}
}
