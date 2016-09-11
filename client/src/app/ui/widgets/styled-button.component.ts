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

    public onClick(event: Event) {
        if (!this.link) return;
        event.stopPropagation();
        window.open(this.link);
    }

    constructor() {

    }
}
