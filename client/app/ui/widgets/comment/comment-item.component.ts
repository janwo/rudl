import {Component, Input} from "@angular/core";
import {Comment} from "../../../models/comment";

@Component({
	templateUrl: 'comment-item.component.html',
	styleUrls: ['comment-item.component.scss'],
	selector: 'comment-item'
})
export class CommentItemComponent {
	
	@Input() comment: Comment = null;
	
	constructor() {}
}
