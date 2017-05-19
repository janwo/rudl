import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {Rudel} from "../../../models/rudel";
import {RudelService} from "../../../services/rudel.service";
import {User} from "../../../models/user";

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
        private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
	    // Define changed params subscription.
	    this.followersSubscription = this.route.parent.data.flatMap((data: { rudel: Rudel }) => {
		    this.rudel = data.rudel;
		    return this.rudelService.followers(data.rudel.id);
	    }).subscribe((followers: User[]) => {
		    this.followers = followers;
	    });
    }
    
	ngOnDestroy(): void {
    	this.followersSubscription.unsubscribe();
	}
}
