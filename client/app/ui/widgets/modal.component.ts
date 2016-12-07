import {
	Input,
	Component,
	Output,
	OnDestroy,
	EventEmitter,
	OnInit,
	Renderer,
	QueryList,
	ElementRef,
	ViewChildren,
	AfterViewInit
} from "@angular/core";
import {Observable, Subscription} from "rxjs";
import {ButtonStyles} from "./styled-button.component";

@Component({
	templateUrl: './modal.component.html',
	styleUrls: ['./modal.component.scss'],
	selector: 'modal'
})
export class ModalComponent {
	
	@Input() title: string;
}
