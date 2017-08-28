import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
	templateUrl: 'styled-button.component.html',
	styleUrls: ['styled-button.component.scss'],
	selector: 'styled-button'
})
export class StyledButtonComponent {
	
	@Input() text: string;
	@Input() icon: string;
    @Input() link: string[];
    @Input() externalLink: string;
	@Input() flag: string;
	@Input() disabled: boolean = false;
	@Input() style: ButtonStyles = ButtonStyles.filled;
	@Output() click: EventEmitter<Event> = new EventEmitter();
	
	public onClick(event: Event) {
		event.stopPropagation();
		event.preventDefault();
		
		// Respect event?
		if (this.disabled) return;
		
		// Fire event.
		this.click.emit(event);
		
		// Route to new location.
		if(this.link) this.router.navigate(this.link, {
            relativeTo: this.route
        });

        if(this.externalLink) {
            const blankIndicator = 'blank:';
            if (this.externalLink.startsWith(blankIndicator)) {
                window.open(this.externalLink.substr(blankIndicator.length));
				return;
            }

            window.location.assign(this.externalLink);
        }
	}
	
	constructor(private router: Router, private route: ActivatedRoute) {}
	
	getStyleClass(): string {
		switch (this.style) {
			case ButtonStyles.facebook:
				return 'filled facebook shadowed';
				
			case ButtonStyles.google:
				return 'filled google shadowed';
				
			case ButtonStyles.filled:
				return 'filled';
				
			case ButtonStyles.filledShadowed:
				return 'filled shadowed';
				
			case ButtonStyles.filledInverse:
				return 'filled-inverse';
				
			case ButtonStyles.filledInverseShadowed:
				return 'filled-inverse shadowed';
				
			case ButtonStyles.outlined:
				return 'outlined';
				
			case ButtonStyles.outlinedShadowed:
				return 'outlined shadowed';
				
			case ButtonStyles.outlinedInverse:
				return 'outlined-inverse';
				
			case ButtonStyles.outlinedInverseShadowed:
				return 'outlined-inverse shadowed';
				
			case ButtonStyles.like:
				return 'filled-inverse shadowed like';
				
			case ButtonStyles.dislike:
				return 'filled-inverse shadowed dislike';
		}
	}
}

export enum ButtonStyles {
	filled, filledShadowed,
	filledInverse, filledInverseShadowed,
	outlined, outlinedShadowed,
	outlinedInverse, outlinedInverseShadowed,
	facebook,
	google,
	dislike,
	like
}
