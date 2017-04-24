import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot, Router} from "@angular/router";
import {Observable} from "rxjs";
import {UserService} from "../services/user.service";
import {User} from "../models/user";

@Injectable()
export class UserResolver implements Resolve<User> {
	
	constructor(
		private userService: UserService,
		private router: Router
	) {}
	
	resolve(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<User> {
		return this.userService.get(route.params['username']).catch(() => {
			this.router.navigate(['/people/not-found']);
			return Promise.resolve(null);
		});
	}
}
