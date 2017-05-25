import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {User} from "../../../models/user";
import {ListService} from "../../../services/list.service";
import {List} from "../../../models/list";
import {ScrollService} from "../../../services/scroll.service";
import {Expedition} from '../../../models/expedition';

@Component({
    templateUrl: 'list-followers.component.html',
    styleUrls: ['list-followers.component.scss']
})
export class ListFollowersComponent implements OnInit, OnDestroy {
	
	followers: User[];
	followersSubscription: Subscription;
    list: List;
    
    constructor(
	    private listService: ListService,
        private route: ActivatedRoute,
	    private scrollService: ScrollService
    ) {}
    
    ngOnInit(){
	    // Define changed params subscription.
	    this.followersSubscription = this.route.parent.data.flatMap((data: { list: List }) => {
		    this.list = data.list;
		    return this.scrollService.hasScrolledToBottom().map(() => this.followers ? this.followers.length : 0).startWith(0).distinct().flatMap((offset: number) => {
			    return this.listService.followers(this.list.id, offset, 25);
		    });
	    }).subscribe((followers: User[]) => {
			if(followers.length < 25) this.followersSubscription.unsubscribe();
			this.followers = this.followers ? this.followers.concat(followers) : followers;
		});
    }
    
	ngOnDestroy(): void {
    	this.followersSubscription.unsubscribe();
	}
}
