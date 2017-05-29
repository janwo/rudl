import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Expedition} from "../../../models/expedition";
import {Comment, CommentRecipe} from "../../../models/comment";
import {EmptyState} from "../../widgets/state/empty.component";
import {CommentService} from '../../../services/comment.service';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {ScrollService} from '../../../services/scroll.service';

@Component({
    templateUrl: 'expedition-comments.component.html',
    styleUrls: ['expedition-comments.component.scss']
})
export class ExpeditionCommentsComponent implements OnInit, OnDestroy {
	
    expedition: Expedition;
	commentsSubscription: Subscription;
	comments: Comment[];
	form: FormGroup;
	submitPending: boolean;
	commentButtonStyle: ButtonStyles = ButtonStyles.filledShadowed;
	
	emptyState: EmptyState = {
		title: 'Start the conversation!',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'Make plans some plans, chat and smile!'
	};
	restrictedState: EmptyState = {
		title: 'Restricted Area',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'You have to become an attendee in order to join the discussion.'
	};
    
    constructor(
	    private fb: FormBuilder,
	    private commentService: CommentService,
	    private route: ActivatedRoute,
	    private scrollService: ScrollService
    ) {}
    
    ngOnInit(){
        // Define changed params subscription.
	    this.commentsSubscription = this.route.parent.data.flatMap((data: { expedition: Expedition }) => {
		    this.expedition = data.expedition;
		    return this.scrollService.hasScrolledToBottom().map(() => this.comments ? this.comments.length : 0).startWith(0).distinct().flatMap((offset: number) => {
			    return this.commentService.getForExpedition(this.expedition.id, offset, 25);
		    });
	    }).subscribe((comments: Comment[]) => {
		    if(comments.length < 25) this.commentsSubscription.unsubscribe();
		    this.comments = this.comments ? this.comments.concat(comments) : comments;
	    });
	    
		// Define form.
		this.form = this.fb.group({
			message: [
				null, [
					Validators.required,
					Validators.minLength(5),
					Validators.maxLength(300)
				]
			],
			pinned: [
				false, [
					Validators.required
				]
			]
		});
    }
    
	ngOnDestroy(): void {
    	this.commentsSubscription.unsubscribe();
	}
	
	submit() {
		for(const key in this.form.controls) this.form.controls[key].markAsTouched();
		if(!this.form.valid) return;
		
		// Mark as pending.
		this.submitPending = true;
		
		// Create recipe.
		let recipe: CommentRecipe = {
			message: this.form.value.message,
			pinned: this.form.value.pinned
		};
		
		// Fire and remove pending state when done.
		this.commentService.createForExpedition(this.expedition.id, recipe).subscribe(comment => {
			this.submitPending = false;
			this.form.get('pinned').reset(false);
			this.form.get('message').reset(null);
			this.comments = [comment].concat(this.comments);
		}, error => {
			this.submitPending = false;
			alert(error.message);
		});
	}
	
	formControlCount(value: string, maxChars: number = 0): (value: string) => {} {
		return (value: string) => `${value.length} of ${maxChars} characters used`;
	}
}
