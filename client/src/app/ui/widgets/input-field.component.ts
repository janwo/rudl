import {Component, Input} from "@angular/core";

@Component({
    template: require('./input-field.component.html'),
    styles: [require('./input-field.component.scss')],
    selector: 'input-field'
})
export class InputFieldComponent {

    @Input() description: string = null;
    @Input() type: string = null;
    @Input() placeholder: string = null;

    constructor() {

    }

    private formatDescription(): string {
        if (this.description) return this.description.replace(/\*(.*)\*/, (...match:Array<string>) => {
            return `<span class="emphasize">${match[1]}</span>`;
        });
        return null;
    }
}