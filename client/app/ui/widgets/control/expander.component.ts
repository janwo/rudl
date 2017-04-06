import {Input, Component} from "@angular/core";
import {ButtonStyles} from "./styled-button.component";

@Component({
	templateUrl: 'expander.component.html',
	styleUrls: ['expander.component.scss'],
	selector: 'expander'
})
export class ExpanderComponent {
	@Input() title: string;
	buttonStyle: ButtonStyles = ButtonStyles.minimal;
	collapsed: boolean = true;
	
	onToggleCollapseState(){
		this.collapsed = !this.collapsed;
	}
}
