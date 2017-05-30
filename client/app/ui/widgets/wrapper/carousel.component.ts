import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';

@Component({
	templateUrl: 'carousel.component.html',
	styleUrls: ['carousel.component.scss'],
	selector: 'carousel'
})
export class CarouselComponent implements OnInit {
	
	@Input() maxSteps = 1;
	protected step: number = 0;
	itemTransformation: SafeStyle;
	
	constructor(private router: Router,
	            private route: ActivatedRoute,
	            private sanitizer: DomSanitizer) {
		// Sanitize style.
		this.itemTransformation = this.sanitizer.bypassSecurityTrustStyle(`translateX(-${this.step * 100}%)`);
	}
	
	next(): void {
		if (this.step < this.maxSteps) this.go(this.step + 1);
	}
	
	back(): void {
		if (this.step > 0) this.go(this.step - 1);
	}
	
	go(index: number): void {
		this.router.navigate([{step: index}], {
			relativeTo: this.route
		});
	}
	
	index(): number {
		return this.step;
	}
	
	ngOnInit(): void {
		// Get params.
		this.route.params.forEach((params: Params) => {
			let step = parseInt(params['step']) || 0;
			
			// Get selected step.
			this.step = Math.min(Math.max(0, step), this.maxSteps - 1);
			
			// Sanitize style.
			this.itemTransformation = this.sanitizer.bypassSecurityTrustStyle(`translateX(-${this.step * 100}%)`);
		});
	}
}
