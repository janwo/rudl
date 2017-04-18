import {Component, HostBinding, HostListener, Input, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {Subscription} from "rxjs/Subscription";

@Component({
    templateUrl: 'menu-item.component.html',
	styleUrls: ['menu-item.component.scss'],
    selector: 'menu-item'
})
export class MenuItemComponent implements OnInit, OnDestroy {
	
	@HostBinding('class.active') isActive: boolean;
    @Input() icon: string;
    @Input() title: string;
    @Input() link: string[];
    routerChanges : Subscription;
    
    constructor(
        private router: Router,
        private route: ActivatedRoute
    ) {}
    
    ngOnInit() {
        this.routerChanges = this.router.events.filter(value => value instanceof NavigationEnd).subscribe(() => {
            if(!this.link) return;
            
            let urlTree = this.router.createUrlTree(this.link, {
                relativeTo: this.route
            });
            this.isActive = this.router.isActive(urlTree, false);
        });
    }
    
    ngOnDestroy(){
        this.routerChanges.unsubscribe();
    }
    
	@HostListener('click')
    onClick() {
    	// Navigate, if link was set.
        if(this.link) this.router.navigate(this.link, {
	        relativeTo: this.route
        });
    }
}
