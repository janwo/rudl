import {Component} from "@angular/core";

@Component({
    template: require('./dashboard.component.html'),
    styles: [ require('./dashboard.component.scss') ],
    selector: 'dashboard'
})
export class DashboardComponent{
    constructor(){
    }
}
