import {Input, Component} from "@angular/core";
import {ButtonStyles} from "./styled-button.component";

@Component({
	template: require('./expander.component.html'),
	styles: [require('./expander.component.scss')],
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
