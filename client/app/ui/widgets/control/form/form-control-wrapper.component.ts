import {AfterContentInit, Component, ContentChild, HostBinding, Input, OnDestroy} from "@angular/core";
import {FormControlName} from "@angular/forms";
import {Subscription} from "rxjs/Subscription";

@Component({
	templateUrl: 'form-control-wrapper.component.html',
	styleUrls: ['form-control-wrapper.component.scss'],
	selector: 'form-control-wrapper'
})
export class FormControlWrapper implements AfterContentInit, OnDestroy {
	
	changes: Subscription;
	@ContentChild(FormControlName) formControlName: FormControlName;
	@Input() description: string;
	@Input() errorMessages: {[key: string]: string};
	errorMessage: string;
	
	@HostBinding('class.valid') get valid() : boolean {
		return this.formControlName.valid;
	};
	
	@HostBinding('class.empty') get empty() : boolean {
		return !this.formControlName.value;
	};
	
	@HostBinding('class.invalid') get invalid(): boolean {
		return this.formControlName.invalid;
	};
	
	@HostBinding('class.touched') get touched(): boolean {
		return this.formControlName.touched;
	};
	
	@HostBinding('class.dirty') get dirty(): boolean {
		return this.formControlName.dirty;
	};
	
	ngAfterContentInit(): void {
		this.updateValidationMessage();
		this.changes = this.formControlName.statusChanges.subscribe(() => this.updateValidationMessage());
	}
	
	updateValidationMessage(): void {
		// Reset error message.
		this.errorMessage = null;
		if(!this.errorMessages || !this.formControlName.invalid) return;
		
		// Are there any errors having an error message?
		for(const key in this.formControlName.errors) {
			if(this.formControlName.errors.hasOwnProperty(key) && this.errorMessages.hasOwnProperty(key)){
				this.errorMessage = this.errorMessages[key];
				break;
			}
		}
	}
	
	ngOnDestroy(): void {
		if(this.changes) this.changes.unsubscribe();
	}
}
