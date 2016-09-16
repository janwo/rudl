import {Component} from "@angular/core";
import {DataService} from "./data.service";

@Component({
    template: require('./app.component.html'),
    styles: [require('./app.component.scss')],
    selector: 'app'
})
export class AppComponent {
    
    constructor(dataService: DataService) {

    }
}
