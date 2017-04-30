import {Component, ElementRef, OnDestroy, OnInit, Optional, Renderer2, ViewChild} from "@angular/core";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {NgControl} from "@angular/forms";
import {UtilService} from "../../../../services/util.service";
import {Subscription} from "rxjs";

@Component({
	templateUrl: 'emoji-picker.component.html',
	styleUrls: ['emoji-picker.component.scss'],
	selector: 'emoji-picker',
	animations: [
		trigger('expandVertically', [
			state('1', style({
				height: '*',
				opacity: 1
			})),
			state('0', style({
				height: 0,
				opacity: 0
			})),
			transition('1 => 0', animate('300ms')),
			transition('0 => 1', animate('300ms'))
		])
	]
})
export class EmojiPickerComponent implements OnInit, OnDestroy {
	
	static iconsPerPage: number = 12;
	
	@ViewChild('pagesSlider') pagesSlider: ElementRef;
	dragging: boolean;
	emoji: string;
	animateTimer: any = {
		timerId: null,
		addend: 0
	};
	iconsSubscription: Subscription;
	page: number = 0;
	pages: {
		category: string,
		icons: {
			name: string,
			image: string
		}[]
	}[];
	categories: string[] = [
		'people',
	    'activity',
		'flags',
		'food',
		'nature',
		'objects',
		'travel'
	];
	
	constructor(
		private utilService: UtilService,
		private renderer: Renderer2,
		@Optional() ngControl: NgControl
	) {
		if (ngControl) ngControl.valueAccessor = this;
	}
	
	ngOnInit(): void {
		this.iconsSubscription = this.utilService.icons().subscribe((icons: any) => {
			// Categorize icons.
			let categorizedIcons: {[key: string]: {
				name: string,
				image: string
			}[]} = {};
			for(let key in icons) {
				let icon = icons[key];
				if(!categorizedIcons[icon.category]) categorizedIcons[icon.category] = [];
				categorizedIcons[icon.category].push({
					name: key,
					image: icon.image
				});
			}
			
			// Build pages.
			let pages: any[] = [];
			let currentPage: any = null;
			let iconsCount = 0;
			this.categories.forEach(category => {
				categorizedIcons[category].forEach(icon => {
					if(currentPage == null || currentPage.category != category || iconsCount >= EmojiPickerComponent.iconsPerPage) {
						// Save old page.
						if(currentPage) pages.push(currentPage);
						
						// Create new page.
						iconsCount = 0;
						currentPage = {
							category: category,
							icons: []
						};
					}
					
					// Add icon.
					iconsCount++;
					currentPage.icons.push(icon);
				});
			});
			
			// Save last page.
			if(currentPage && currentPage.icons.length) pages.push(currentPage);
			
			// Assign random icons, if not set yet.
			if(!this.emoji) {
				let randomPage = pages[Math.floor(pages.length * Math.random())];
				this.emoji = randomPage.icons[Math.floor(randomPage.icons.length * Math.random())].name;
				this.onChange(this.emoji);
			}
			
			// Save pages.
			this.pages = pages;
			
			// Update current page.
			this.page = this.determinePageIndex();
		});
	}
	
	ngOnDestroy(): void {
		this.iconsSubscription.unsubscribe();
	}
	
	writeValue(value: string): void {
		if(value) this.emoji = value;
		this.page = this.determinePageIndex();
	}
	
	determinePageIndex(): number {
		return this.pages ? Math.max(this.pages.findIndex(page => page.icons.findIndex(icon => icon.name == this.emoji) >= 0), 0) : 0;
	}
	
	selectCategory(category: string) {
		if(!this.pages) return;
		
		// Get to first icon position with the corresponding category.
		this.page = this.pages.findIndex(page => page.category == category);
	}
	
	selectEmoji(emoji: string) {
		this.emoji = emoji;
		this.onChange(emoji);
	}
	
	pan(event: {
		    deltaX: number,
		    deltaY: number,
		    target: any,
		    preventDefault: () => void,
		    stopPropagation: () => void,
		    isFinal: boolean
	}) {
		event.preventDefault();
		this.dragging = true;
		
		// Get parameters.
		let canSwipeRight = this.pages.length > this.page + 1;
		let canSwipeLeft = this.page > 0;
		let translateX = event.deltaX;
		let maxOffsets = this.pagesSlider.nativeElement.offsetWidth;
		let rangeX = Math.min(Math.max(translateX / maxOffsets, canSwipeRight ? - 1 : 0), canSwipeLeft ? 1 : 0) * 100;
		this.transform(rangeX - 100);
		
		// Done dragging? Determine, whether to slide the page or allow clicking any children.
		if(event.isFinal) {
			// Change page.
			if(Math.abs(rangeX) < 25) {
				this.transform(- 100);
				this.dragging = false;
				return;
			}
			
			// Finish swipe.
			let addend = - rangeX > 0 ? 1 : -1;
			this.transform( - addend * 100 - 100);
			
			// Clear previous timer, if any.
			if(this.animateTimer.timerId) {
				this.page += this.animateTimer.addend;
				clearTimeout(this.animateTimer.timerId);
			}
			
			// Set timer to transform back to idle state.
			this.animateTimer.addend = addend;
			this.animateTimer.timerId = setTimeout(() => {
				this.animateTimer.timerId = null;
				this.transform(- 100);
				this.page += addend;
				this.dragging = false;
			}, 300);
		}
	}
	
	transform(translateX: number) {
		// Transform whole stack item.
		this.renderer.setStyle(this.pagesSlider.nativeElement, 'transform', `translateX(${translateX}%)`);
	}
	
	onChange = (_: any) => {};
	onTouched = () => {};
	registerOnChange(fn: (_: any) => void): void { this.onChange = fn; }
	registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}
