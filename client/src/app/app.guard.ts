import {CanActivate, Router} from "@angular/router";
import {DataService} from "./services/data.service";
import {Injectable} from "@angular/core";

@Injectable()
export class AppGuard implements CanActivate {

    constructor(
        private dataService: DataService,
        private router: Router) {}

    canActivate() {
        let loggedIn = this.dataService.getToken() !== null;
        if (!loggedIn) this.router.navigate(['/sign_up']);
        return loggedIn;
    }
}
