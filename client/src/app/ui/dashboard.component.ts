import {Component} from "@angular/core";

@Component({
    template: require('./dashboard.component.html'),
    styles: [require('./dashboard.component.scss')]
})
export class DashboardComponent {
    
    constructor() {
        console.log('DASHBOARD');
    }
}
