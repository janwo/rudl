import {Component, Input} from "@angular/core";

@Component({
    template: require('./button.component.html'),
    styles: [ require('./button.component.scss') ],
    selector: 'button'
})
export class ButtonComponent{

    @Input() text : string = null;
    @Input() fa : string = null;
    @Input() link : string = null;

    constructor(){
    }
}
