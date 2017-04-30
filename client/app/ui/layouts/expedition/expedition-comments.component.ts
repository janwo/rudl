import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Expedition} from "../../../models/expedition";
import {Comment} from "../../../models/comment";
import {EmptyState} from "../../widgets/state/empty.component";
import {CommentService, CommentType} from '../../../services/comment.service';

@Component({
    templateUrl: 'expedition-comments.component.html',
    styleUrls: ['expedition-comments.component.scss']
})
export class ExpeditionCommentsComponent implements OnInit, OnDestroy {
	
    expedition: Expedition;
	expeditionSubscription: Subscription;
	comments: Comment[];
	emptyState: EmptyState = {
		title: 'Start the conversation!',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'Make plans some plans, chat and smile!'
	};
	unapprovedState: EmptyState = {
		title: 'You are not approved',
		image: require('../../../../assets/boarding/radar.png'),
		description: 'We couldn\'t get you in there. You have to get approved!'
	};
    
    constructor(
	    private commentService: CommentService,
	    private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
        // Define changed params subscription.
	    this.expeditionSubscription = this.route.parent.data.flatMap((data: { expedition: Expedition }) => {
		    this.expedition = data.expedition;
		    return this.commentService.get(CommentType.expedition, data.expedition.id, 0, 20);
	    }).subscribe((comments: Comment[]) => {
		   this.comments = comments;
	    });
    }
    
	ngOnDestroy(): void {
    	this.expeditionSubscription.unsubscribe();
	}
}
