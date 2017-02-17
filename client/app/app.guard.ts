import {CanActivate, Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {UserService, UserStatus} from "./services/user.service";
import {Observable} from "rxjs";

@Injectable()
export class AppGuard implements CanActivate {

    constructor(
        private userService: UserService,
        private router: Router
    ) {}

    canActivate() : Observable<boolean> {
        return this.userService.getAuthenticatedUserObservable().map((user: UserStatus) => {
            if (!user.loggedIn) this.router.navigate(['/sign_up']);
            return user.loggedIn;
        });
    }
}
