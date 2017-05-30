import {
	AfterViewInit,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnDestroy,
	OnInit,
	Output,
	QueryList,
	Renderer2,
	ViewChildren
} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {ButtonStyles} from '../control/styled-button.component';

export interface StackResult {
	content: any;
	markedAs: 'like' | 'dislike';
}

@Component({
	template: '<div class="card"><ng-content></ng-content></div>',
	selector: 'stack-card'
})
export class StackCardComponent implements AfterViewInit {
	
	@Input() amplitude: number = 5;
	
	constructor(private renderer: Renderer2,
	            private element: ElementRef) {}
	
	ngAfterViewInit(): void {
		this.setRotation(Math.random() * this.amplitude * 2 - this.amplitude);
	}
	
	setRotation(rotation: number) {
		// Transform nested card.
		this.renderer.setStyle(this.element.nativeElement.firstElementChild, 'transform', `rotate(${rotation}deg)`);
	}
	
	setProgress(markedAs: 'like' | 'dislike', range: number) {
		// Style overlay.
		let overlay = this.element.nativeElement.firstElementChild.lastElementChild;
		this.renderer.setStyle(overlay, 'opacity', range.toString());
		this.renderer.setStyle(overlay.lastElementChild, 'width', `${range * 100}%`);
		this.renderer.setStyle(overlay.lastElementChild, 'complete', range == 1);
		switch (markedAs) {
			case 'like':
				this.renderer.removeClass(overlay, 'dislike');
				this.renderer.addClass(overlay, 'like');
				break;
			
			case 'dislike':
				this.renderer.removeClass(overlay, 'like');
				this.renderer.addClass(overlay, 'dislike');
				break;
		}
	}
	
	transform(rotation: number, translateX: number, translateY: number) {
		// Transform whole stack item.
		this.renderer.setStyle(this.element.nativeElement, 'transform', `rotate(${rotation}deg) translate3d(0, 0, 0) translate(${translateX}px, ${translateY}px)`);
	}
}

@Component({
	templateUrl: 'stack.component.html',
	styleUrls: ['stack.component.scss'],
	selector: 'stack'
})
export class StackComponent implements OnDestroy, OnInit {
	
	@Input() inboundStream: Observable<any[]>;
	@Output() outboundStream: EventEmitter<StackResult> = new EventEmitter<StackResult>();
	inboundStreamSubscription: Subscription;
	
	inDragMode: boolean;
	
	stack: any[] = [];
	stackIndex: number = 0;
	currentStackItem: StackCardComponent;
	@ViewChildren(StackCardComponent) stackItems: QueryList<StackCardComponent>;
	dislikeButtonStyle: ButtonStyles = ButtonStyles.dislike;
	likeButtonStyle: ButtonStyles = ButtonStyles.like;
	
	constructor(private rootElement: ElementRef) {}
	
	ngOnInit(): void {
		this.inboundStreamSubscription = this.inboundStream.subscribe(contents => contents.forEach(content => this.stack.push(content)));
	}
	
	getStackItem(): StackCardComponent {
		// Stack items are enqueued in the DOM in a reversed order.
		if (!this.currentStackItem) {
			this.currentStackItem = this.stackItems.toArray()[this.stack.length - 1 - this.stackIndex];
			this.currentStackItem.setRotation(0);
		}
		
		// Return current stack item.
		return this.currentStackItem;
	}
	
	nextStackItem(): void {
		this.stackIndex++;
		this.currentStackItem = null;
	}
	
	ngOnDestroy(): void {
		this.inboundStreamSubscription.unsubscribe();
		this.outboundStream.complete();
	}
	
	getMaxOffsets(): {
		x: number,
		y: number
	} {
		return {
			y: this.rootElement.nativeElement.offsetHeight / 2 * 0.25,
			x: this.rootElement.nativeElement.offsetWidth / 2 * 0.25
		};
	}
	
	pan(event: {
		deltaX: number,
		deltaY: number,
		isFinal: boolean
	}) {
		// Toggle state.
		this.inDragMode = !event.isFinal;
		let stackItem = this.getStackItem();
		
		// Get parameters.
		let translateX = event.deltaX;
		let translateY = event.deltaY;
		let maxOffsets = this.getMaxOffsets();
		let rangeX = Math.max(Math.min(translateX / maxOffsets.x, 1), -1);
		let rangeY = Math.max(Math.min(translateY / maxOffsets.y, 1), -1);
		let rangeXAbsolute = Math.abs(rangeX);
		let rangeYAbsolute = Math.abs(rangeY);
		let rotation = rangeY * stackItem.amplitude;
		
		// Manipulate parameters.
		translateY = rangeY / rangeYAbsolute * maxOffsets.y * rangeYAbsolute * (2 - rangeYAbsolute);
		
		// Set markedAs status.
		let markedAs: 'like' | 'dislike' = rangeX > 0 ? 'like' : 'dislike';
		
		// Apply moving transformation.
		stackItem.setProgress(markedAs, rangeXAbsolute);
		stackItem.transform(rotation, translateX, translateY);
		
		// Done dragging? Determine, whether to mark the item.
		if (event.isFinal) this.markAs(rangeXAbsolute == 1 ? markedAs : null);
	}
	
	markAs(markedAs: 'like' | 'dislike' = null) {
		let stackItem = this.getStackItem();
		let translateX = markedAs ? this.getMaxOffsets().x * 10 : 0;
		
		// Apply final transformation.
		stackItem.transform(0, markedAs == 'dislike' ? -translateX : translateX, 0);
		stackItem.setProgress(markedAs, markedAs ? 1 : 0);
		
		// Successfully marked a stack item?
		if (markedAs) {
			// Emit result.
			this.outboundStream.emit({
				content: this.stack[this.stackIndex],
				markedAs: markedAs
			});
			
			// Go to next stack item.
			this.nextStackItem();
		}
	}
}
