import {Component, Input, ElementRef, EventEmitter, Output, OnInit, ViewChild, AfterViewInit} from "@angular/core";

@Component({
    templateUrl: 'input-field.component.html',
    styleUrls: ['input-field.component.scss'],
    selector: 'input-field'
})
export class InputFieldComponent implements OnInit, AfterViewInit {

    @Input() description: string = null;
    @Input() type: 'text' | 'textarea' | 'mail' | 'password' = 'text';
    @Input() id: string;
    @Input() value: string;
    @Input() placeholder: string = null;
    @Output() keyup = new EventEmitter();
    @ViewChild('inputField') inputField: ElementRef;
	
	ngOnInit(): void {
	}
	
	ngAfterViewInit(): void {
	}
	
	clear(): void {
		this.inputField.nativeElement.value = '';
	}
}
