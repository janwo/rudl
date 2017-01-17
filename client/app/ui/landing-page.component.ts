import {Component} from "@angular/core";

@Component({
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent {
    
    constructor() {}
    
    openExternalLink(link: string): void {
        window.open(link);
    }
}
