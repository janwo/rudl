import {Component, Input} from "@angular/core";

@Component({
    templateUrl: './styled-button.component.html',
    styleUrls: ['./styled-button.component.scss'],
    selector: 'styled-button'
})
export class StyledButtonComponent {

    @Input() text: string = null;
    @Input() fa: string = null;
    @Input() link: string = null;
    @Input() disabled: boolean = false;
    @Input() style: ButtonStyles = ButtonStyles.default;

    public onClick(event: Event) {
        if (!this.link) return;
        event.stopPropagation();
        window.open(this.link);
    }

    constructor() {}
    
    getStyleClass(){
        switch(this.style) {
            case ButtonStyles.default: return 'style-default';
            case ButtonStyles.minimal: return 'style-minimal';
            case ButtonStyles.minimalInverse: return 'style-minimal-inverse';
        }
    }
}

export enum ButtonStyles {
    default, minimal, minimalInverse
}
