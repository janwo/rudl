import {Injectable} from "@angular/core";
import {CanActivate, Router} from "@angular/router";
import {AuthService} from "./auth.service";

@Injectable()
export class AppGuard implements CanActivate {
    authService: AuthService;
    router: Router;

    constructor(authService: AuthService, router: Router) {
        this.authService = authService;
        this.router = router;
    }

    canActivate() {
        let loggedIn = this.authService.getToken() !== false;
        if (!loggedIn) this.router.navigateByUrl('signup');
        return loggedIn;
    }
}
