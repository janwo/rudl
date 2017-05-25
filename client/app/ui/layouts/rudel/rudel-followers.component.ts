import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Rudel} from "../../../models/rudel";
import {RudelService} from "../../../services/rudel.service";
import {User} from "../../../models/user";
import {ScrollService} from '../../../services/scroll.service';

@Component({
    templateUrl: 'rudel-followers.component.html',
    styleUrls: ['rudel-followers.component.scss']
})
export class RudelFollowersComponent implements OnInit, OnDestroy {
	
	followers: User[];
	followersSubscription: Subscription;
    rudel: Rudel;
    
    constructor(
	    private rudelService: RudelService,
        private route: ActivatedRoute,
	    private scrollService: ScrollService
    ) {}
    
    ngOnInit(){
	    // Define changed params subscription.
	    this.followersSubscription = this.route.parent.data.flatMap((data: { rudel: Rudel }) => {
		    this.rudel = data.rudel;
		    return this.scrollService.hasScrolledToBottom().map(() => this.followers ? this.followers.length : 0).startWith(0).distinct().flatMap((offset: number) => {
			    return this.rudelService.followers(this.rudel.id, offset, 25);
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
