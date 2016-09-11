import {Component, Input} from "@angular/core";

@Component({
    templateUrl: 'styled-button.component.html',
    styleUrls: ['styled-button.component.scss'],
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
