import {Component} from "@angular/core";
import {AuthService} from "./auth.service";

@Component({
    template: require('./app.component.html'),
    styles: [require('./app.component.scss')],
    selector: 'app'
})
export class AppComponent {
    constructor(authService: AuthService) {

    }
}
