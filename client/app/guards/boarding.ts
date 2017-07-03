import {CanActivate, Router} from '@angular/router';
import {Injectable} from '@angular/core';
import {UserService, UserStatus} from '../services/user.service';
import {Observable} from 'rxjs';

@Injectable()
export class BoardingGuard implements CanActivate {
	
	constructor(private userService: UserService,
	            private router: Router) {}
	
	canActivate(): Observable<boolean> {
		return this.userService.getAuthenticatedUserObservable().map((userStatus: UserStatus) => {
			if (!userStatus.user.onBoard) {
				let boardingUrl = this.router.createUrlTree(['/illustrations']);
				if (!this.router.isActive(boardingUrl, false)) this.router.navigateByUrl(boardingUrl);
			}
			
			return userStatus.user.onBoard;
		});
	}
}
