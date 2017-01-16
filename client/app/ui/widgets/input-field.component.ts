import {Component, Input} from "@angular/core";

@Component({
    templateUrl: './input-field.component.html',
    styleUrls: ['./input-field.component.scss'],
    selector: 'input-field'
})
export class InputFieldComponent {

    @Input() description: string = null;
    @Input() type: string = null;
    @Input() id: string;
    @Input() placeholder: string = null;
}
