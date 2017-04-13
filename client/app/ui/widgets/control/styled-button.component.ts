import {Component, Input, Output, EventEmitter} from "@angular/core";

@Component({
    templateUrl: 'styled-button.component.html',
    styleUrls: ['styled-button.component.scss'],
    selector: 'styled-button'
})
export class StyledButtonComponent {

    @Input() text: string = null;
    @Input() fa: string = null;
    @Input() link: string = null;
    @Input() flag: string = null;
    @Input() disabled: boolean = false;
    @Input() style: ButtonStyles = ButtonStyles.filled;
    @Output() click: EventEmitter<Event> = new EventEmitter();

    public onClick(event: Event) {
        event.stopPropagation();
        event.preventDefault();
        
        // Respect event?
        if(this.disabled) return;
        
        // Fire event.
        this.click.emit(event);
        
        // Route to new location.
        if (!this.link) return;
        window.open(this.link);
    }

    constructor() {}
    
    getStyleClass(){
        switch(this.style) {
            case ButtonStyles.facebook: return 'filled facebook shadowed';
            case ButtonStyles.google: return 'filled google shadowed';
	        case ButtonStyles.filled: return 'filled';
	        case ButtonStyles.filledShadowed: return 'filled shadowed';
	        case ButtonStyles.filledInverse: return 'filled-inverse';
	        case ButtonStyles.filledInverseShadowed: return 'filled-inverse shadowed';
	        case ButtonStyles.outlined: return 'outlined';
	        case ButtonStyles.outlinedShadowed: return 'outlined shadowed';
	        case ButtonStyles.outlinedInverse: return 'outlined-inverse';
	        case ButtonStyles.outlinedInverseShadowed: return 'outlined-inverse shadowed';
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
