import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, RouterStateSnapshot, Resolve, Params} from "@angular/router";
import {Observable} from "rxjs";
import {UserService} from "../services/user.service";
import {User} from "../models/user";

@Injectable()
export class UserResolver implements Resolve<User> {
	
	constructor(private userService: UserService) {}
	
	resolve(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<User> {
		return this.userService.get(route.params['username']);
	}
}
