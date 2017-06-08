import {
	AfterContentInit, Component, ContentChildren, Input, OnInit, QueryList, ViewChildren, ChangeDetectorRef,
	OnDestroy, AfterViewChecked
} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';

@Component({
	selector: 'carousel-slide',
	template: '<ng-content></ng-content>'
})
export class CarouselSlideComponent {}

@Component({
	templateUrl: 'carousel.component.html',
	styleUrls: ['carousel.component.scss'],
	selector: 'carousel'
})
export class CarouselComponent implements OnInit {
	
	@Input() pageSize = 1;
	private itemIndex: number = 0;
	itemTransformation: SafeStyle;
	@ContentChildren(CarouselSlideComponent) protected children: QueryList<CarouselSlideComponent>;
	
	constructor(private router: Router,
	            private route: ActivatedRoute,
	            private sanitizer: DomSanitizer) {}
	
	next(): void {
		if (this.children && this.itemIndex < this.children.length - 1) this.go(this.itemIndex + 1);
	}
	
	back(): void {
		if (this.itemIndex > 0) this.go(this.itemIndex - 1);
	}
	
	go(step: number): void {
		this.router.navigate([{idx: step}], {
			relativeTo: this.route
		});
	}
	
	ready(): boolean {
		return !!this.children;
	}
	
	index(): number {
		return this.itemIndex;
	}
	
	length(): number {
		return this.children ? this.children.length : 0;
	}
	
	ngOnInit(): void {
		// Get params.
		this.route.params.forEach((params: Params) => {
			let step = parseInt(params['idx']) || 0;
			
			// Get selected step.
			this.itemIndex = this.children ? Math.min(Math.max(0, step), this.children.length - 1) : 0;
			
			// Sanitize style.
			this.itemTransformation = this.sanitizer.bypassSecurityTrustStyle(`translateX(-${this.itemIndex * 100}%)`);
		});
	}
}
