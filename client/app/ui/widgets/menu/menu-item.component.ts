import {
	AfterViewChecked,
	Component,
	HostBinding,
	HostListener,
	Input,
	OnDestroy,
	OnInit
} from '@angular/core';
import {ActivatedRoute, Event, NavigationEnd, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
	templateUrl: 'menu-item.component.html',
	styleUrls: ['menu-item.component.scss'],
	selector: 'menu-item',
	animations: [
		trigger('expandHorizontally', [
			state('expanded', style({
				width: '*',
				opacity: 1
			})),
			state('collapsed', style({
				width: 0,
				opacity: 0
			})),
			transition('* => *', animate('0.3s'))
		])
	]
})
export class MenuItemComponent implements OnInit, OnDestroy, AfterViewChecked {
	
	@HostBinding('class.active') isActive: boolean = false;
	@Input() makeRoomIfSmall: boolean;
	makeRoom: boolean = false;
	static mql: MediaQueryList = window.matchMedia('(min-width: 40rem)');
	@Input() icon: string;
	@Input() title: string;
	@Input() link: string[];
	@Input() notification: boolean;
	routerChanges: Subscription;
	checkRoom = (mql: MediaQueryList): void => {
		this.makeRoom = !mql.matches;
	};
	
	constructor(private router: Router,
	            private route: ActivatedRoute) {}
	
	getAnimationState(): string {
		if (!this.makeRoomIfSmall) return null;
		return this.isActive || !this.makeRoom ? 'expanded' : 'collapsed';
	}
	
	ngOnInit() {
        this.update();
		this.routerChanges = this.router.events.filter((event: Event) => event instanceof NavigationEnd).subscribe(() => this.update());
	}

	update(): void {
        if (!this.link) {
            this.isActive = false;
            return;
        }

        let urlTree = this.router.createUrlTree(this.link, {
            relativeTo: this.route
        });

        this.isActive = this.router.isActive(urlTree, false);
    }
	
	ngAfterViewChecked() {
		if (this.makeRoomIfSmall) {
			MenuItemComponent.mql.addListener(this.checkRoom);
			this.checkRoom(MenuItemComponent.mql);
		}
	}
	
	ngOnDestroy() {
		this.routerChanges.unsubscribe();
		MenuItemComponent.mql.removeListener(this.checkRoom);
	}
	
	@HostListener('click')
	onClick() {
		// Navigate, if link was set.
		if (this.link) this.router.navigate(this.link, {
			relativeTo: this.route
		});
	}
}
