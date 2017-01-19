import {Component} from "@angular/core";
import {ActivatedRoute} from "@angular/router";

@Component({
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent {
    
    showLogin: boolean;
    
    constructor(
        private route: ActivatedRoute
    ) {
        this.showLogin = this.route.snapshot.data['login'];
    }
    
    openExternalLink(link: string): void {
        window.open(link);
    }
}
