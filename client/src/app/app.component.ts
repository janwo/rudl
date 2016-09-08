import {Component} from "@angular/core";
import {AuthService} from "./auth.service";

@Component({
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    selector: 'app'
})
export class AppComponent {
    
    constructor(authService: AuthService) {

    }
}
