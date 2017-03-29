import {Component, Input, ElementRef, OnInit, ViewChild, AfterViewInit, AfterContentInit} from "@angular/core";

@Component({
	templateUrl: 'input-wrapper.component.html',
	styleUrls: ['input-wrapper.component.scss'],
	selector: 'input-wrapper'
})
export class InputFieldComponent implements AfterContentInit {
	
	ngAfterContentInit(): void {
	}
}
