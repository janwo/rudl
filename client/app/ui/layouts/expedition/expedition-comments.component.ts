import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Expedition} from "../../../models/expedition";
import {Comment, CommentRecipe} from "../../../models/comment";
import {EmptyState} from "../../widgets/state/empty.component";
import {CommentService} from '../../../services/comment.service';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

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
	
	emptyState: EmptyState = {
		title: 'Start the conversation!',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'Make plans some plans, chat and smile!'
	};
	restrictedState: EmptyState = {
		title: 'Restricted Area',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'You have to become an attendee in order to access this area!'
	};
    
    constructor(
	    private fb: FormBuilder,
	    private commentService: CommentService,
	    private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
        // Define changed params subscription.
	    this.commentsSubscription = this.route.parent.data.flatMap((data: { expedition: Expedition }) => {
		    this.expedition = data.expedition;
		    return this.commentService.getForExpedition(data.expedition.id, 0);
	    }).subscribe((comments: Comment[]) => {
		   this.comments = comments;
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
			//TODO Add
		}, error => {
			this.submitPending = false;
			alert(error.message);
		});
	}
	
	formControlCount(value: string, maxChars: number = 0): (value: string) => {} {
		return (value: string) => `${value.length} of ${maxChars} characters used`;
	}
}
