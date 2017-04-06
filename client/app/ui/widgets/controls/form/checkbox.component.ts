import {Component, ElementRef, HostListener, Input, Optional} from "@angular/core";
import {ControlValueAccessor, NgControl} from "@angular/forms";

@Component({
    templateUrl: 'checkbox.component.html',
    styleUrls: ['checkbox.component.scss'],
    selector: 'checkbox'
})
export class CheckboxComponent implements ControlValueAccessor {
 
	checked: boolean;
	@Input() text: string;
	
    @HostListener('click') toggle(): void {
        this.checked = !this.checked;
	    this.onChange(this.checked);
	    this.onTouched();
    }
	
	constructor(@Optional() ngControl: NgControl) {
		if (ngControl) ngControl.valueAccessor = this;
	}
	
    writeValue(value: boolean): void {
        if(value === true || value === false) this.checked = value;
    }
    
    onChange = (_: any) => {};
    onTouched = () => {};
    registerOnChange(fn: (_: any) => void): void { this.onChange = fn; }
    registerOnTouched(fn: () => void): void { this.onTouched = fn; }
    
}
