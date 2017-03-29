import {Component, AfterContentInit} from "@angular/core";

@Component({
	templateUrl: 'input-wrapper.component.html',
	styleUrls: ['input-wrapper.component.scss'],
	selector: 'input-wrapper'
})
export class InputFieldWrapper implements AfterContentInit {
	
	input: any = {};
	
	ngAfterContentInit(): void {
	}
}
