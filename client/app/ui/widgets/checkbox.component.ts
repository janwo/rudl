import {Component, Input, EventEmitter, Output} from "@angular/core";

@Component({
    templateUrl: './checkbox.component.html',
    styleUrls: ['./checkbox.component.scss'],
    selector: 'checkbox'
})
export class CheckboxComponent {

    @Input() checked: boolean;
    @Output() change: EventEmitter<boolean> = new EventEmitter();
    
    toggle(): void {
        this.checked = !this.checked;
        this.change.emit(this.checked);
    }
}
