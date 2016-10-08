import {Component, Input} from "@angular/core";

@Component({
    template: require('./styled-button.component.html'),
    styles: [require('./styled-button.component.scss')],
    selector: 'styled-button'
})
export class StyledButtonComponent {

    @Input() text: string = null;
    @Input() fa: string = null;
    @Input() link: string = null;
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
        }
    }
}

export enum ButtonStyles {
    'default', 'minimal'
}
