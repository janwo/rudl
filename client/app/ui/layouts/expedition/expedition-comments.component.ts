import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {Comment, CommentRecipe} from '../../../models/comment';
import {EmptyState} from '../../widgets/state/empty.component';
import {CommentService} from '../../../services/comment.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {ScrollService} from '../../../services/scroll.service';
import {ExpeditionComponent} from './expedition.component';
import {Title} from '@angular/platform-browser';
import {Locale} from "../../../../../server/app/models/Translations";
import {UserService} from "../../../services/user.service";

@Component({
	templateUrl: 'expedition-comments.component.html',
	styleUrls: ['expedition-comments.component.scss']
})
export class ExpeditionCommentsComponent implements OnInit, OnDestroy {
	
	commentsSubscription: Subscription;
	comments: Comment[];
	form: FormGroup;
	submitPending: boolean;
	commentButtonStyle: ButtonStyles = ButtonStyles.filledShadowed;
	
	emptyState: EmptyState = {
		title: 'Fragen?',//Start the conversation!
		image: require('../../../../assets/illustrations/no-comments.png'),
		description: 'Muss noch was organisiert werden? Tausche dich mit den anderen Teilnehmern aus.'
	};
	restrictedState: EmptyState = {
		title: 'Eingeschränkter Bereich',//Restricted Area
		image: require('../../../../assets/illustrations/no-comments.png'),
		description: 'Du musst Teilnehmer sein, um sich der Diskussion anzuschließen.'//You have to become an attendee in order to join the discussion.
	};
	
	constructor(private fb: FormBuilder,
	            private commentService: CommentService,
	            private scrollService: ScrollService,
	            public parent: ExpeditionComponent,
	            private title: Title) {}
	
	ngOnInit() {
		this.title.setTitle(`Streifzug "${this.parent.expedition.getValue().title}" - Diskussion | rudl.me`);
		
		// Define changed params subscription.
		this.commentsSubscription = this.scrollService.hasScrolledToBottom().map(() => this.comments ? this.comments.length : 0).startWith(0).distinct().flatMap((offset: number) => {
			return this.commentService.getForExpedition(this.parent.expedition.getValue().id, offset, 25);
		}).subscribe((comments: Comment[]) => {
			if (comments.length < 25) this.commentsSubscription.unsubscribe();
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
		for (const key in this.form.controls) this.form.controls[key].markAsTouched();
		if (!this.form.valid) return;
		
		// Mark as pending.
		this.submitPending = true;
		
		// Create recipe.
		let recipe: CommentRecipe = {
			message: this.form.value.message,
			pinned: this.form.value.pinned
		};
		
		// Fire and remove pending state when done.
		this.commentService.createForExpedition(this.parent.expedition.getValue().id, recipe).subscribe(comment => {
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
		return (value: string) => `${value ? value.length : 0} von ${maxChars} Buchstaben verwendet`;//characters used
	}
}
