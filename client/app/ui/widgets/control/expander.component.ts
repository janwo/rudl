import {Component, Input} from '@angular/core';
import {ButtonStyles} from './styled-button.component';

@Component({
	templateUrl: 'expander.component.html',
	styleUrls: ['expander.component.scss'],
	selector: 'expander'
})
export class ExpanderComponent {
	@Input() title: string;
	buttonStyle: ButtonStyles = ButtonStyles.filled;
	collapsed: boolean = true;
	
	onToggleCollapseState() {
		this.collapsed = !this.collapsed;
	}
}
