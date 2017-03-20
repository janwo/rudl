import {Component, Input, EventEmitter, Output, HostListener} from "@angular/core";

@Component({
    templateUrl: 'checkbox.component.html',
    styleUrls: ['checkbox.component.scss'],
    selector: 'checkbox'
})
export class CheckboxComponent {
    
    @Input() checked: boolean;
    @Input() value: string;
    @Output() change: EventEmitter<boolean> = new EventEmitter();
    
    @HostListener('click') toggle(): void {
        this.checked = !this.checked;
        this.change.emit(this.checked);
    }
}
