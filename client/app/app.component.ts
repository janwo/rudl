import {Component} from "@angular/core";
import {DataService} from "./services/data.service";
import {Router} from "@angular/router";

@Component({
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    selector: 'app'
})
export class AppComponent {
    
    constructor(
        private dataService: DataService,
        private router: Router
    ) {}
}
