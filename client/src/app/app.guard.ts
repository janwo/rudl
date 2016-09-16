import {Injectable} from "@angular/core";
import {CanActivate, Router} from "@angular/router";
import {DataService} from "./data.service";

@Injectable()
export class AppGuard implements CanActivate {
    dataService: DataService;
    router: Router;

    constructor(authService: DataService, router: Router) {
        this.dataService = authService;
        this.router = router;
    }

    canActivate() {
        let loggedIn = this.dataService.getToken() !== null;
        if (!loggedIn) this.router.navigate(['/sign-up']);
        return loggedIn;
    }
}
