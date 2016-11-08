import {Component} from "@angular/core";
import {DataService} from "./services/data.service";

@Component({
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    selector: 'app'
})
export class AppComponent {
    
    constructor(
        private dataService: DataService
    ) {}
}
