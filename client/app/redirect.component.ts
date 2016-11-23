import {Component, OnInit} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";

@Component({
    template: ''
})
export class RedirectComponent implements OnInit {
    
    ngOnInit() {
        let redirect : Array<string> = this.route.snapshot.data['redirect'];
        this.router.navigate(redirect, {
            relativeTo: this.route,
            replaceUrl: true
        });
    }
    
    constructor(
        private router: Router,
        private route: ActivatedRoute
    ) {}
}
