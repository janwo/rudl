import {Component, Input} from "@angular/core";

@Component({
    template: require('./input-field.component.html'),
    styles: [ require('./input-field.component.scss') ],
    selector: 'input-field'
})
export class InputFieldComponent{

    @Input() description : string = null;
    @Input() type : string = null;
    @Input() placeholder : string = null;

    private static inputAttributes : any = {
        type: 'mail',
        attributes: [
            {
                name: 'spellcheck',
                value: false
            },
            {
                name: 'autocomplete',
                value: 'off'
            },
            {
                name: 'type',
                value: 'text'
            }
        ]
    };

    constructor(){
    }

    private formatDescription() : string {
        if(this.description) return this.description.replace(/\*(.*)\*/, (...match) => {
            return `<span class="emphasize">${match[1]}</span>`;
        });
        return null;
    }
}
