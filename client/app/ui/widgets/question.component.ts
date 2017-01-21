import {
	Input,
	Component,
} from "@angular/core";
import {ButtonStyles} from "./styled-button.component";

@Component({
	templateUrl: './question.component.html',
	styleUrls: ['./question.component.scss'],
	selector: 'question'
})
export class QuestionComponent {
	
	@Input() title: string;
	@Input() description: string;
	@Input() choices: QuestionChoices[];
}

export interface QuestionChoices {
	text: string;
	style: ButtonStyles;
	callback: void;
}
