import {Component, Input, OnInit} from "@angular/core";
import {Comment} from "../../../models/comment";
import * as moment from 'moment';

@Component({
	templateUrl: 'comment-item.component.html',
	styleUrls: ['comment-item.component.scss'],
	selector: 'comment-item'
})
export class CommentItemComponent implements OnInit{
	
	@Input() comment: Comment = null;
	formattedDate: string;
	
	constructor() {}
	
	ngOnInit(): void {
		this.formattedDate = `${moment.duration(moment().diff(this.comment.createdAt)).humanize()} ago`;
	}
}
