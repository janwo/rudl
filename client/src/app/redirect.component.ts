import {Component} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";

@Component({
    template: ''
})
export class RedirectComponent {
    
    ngOnInit() {
        let redirect : Array<string> = this.route.snapshot.data['redirect'];
        this.router.navigate(redirect, {
            relativeTo: this.route,
            skipLocationChange: true
        });
    }
    
    constructor(
        private router: Router,
        private route: ActivatedRoute
    ) {}
}
