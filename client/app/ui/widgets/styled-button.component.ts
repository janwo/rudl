import {Component, Input, Output, EventEmitter} from "@angular/core";

@Component({
    templateUrl: './styled-button.component.html',
    styleUrls: ['./styled-button.component.scss'],
    selector: 'styled-button'
})
export class StyledButtonComponent {

    @Input() text: string = null;
    @Input() fa: string = null;
    @Input() link: string = null;
    @Input() flag: string = null;
    @Input() disabled: boolean = false;
    @Input() style: ButtonStyles = ButtonStyles.default;
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
            case ButtonStyles.default: return 'default';
            case ButtonStyles.minimal: return 'minimal';
            case ButtonStyles.uncolored: return 'uncolored';
            case ButtonStyles.minimalInverse: return 'minimal-inverse';
        }
    }
}

export enum ButtonStyles {
    default, minimal, minimalInverse, uncolored
}
