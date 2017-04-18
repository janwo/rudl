import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {User} from "../../../models/user";
import {ListService} from "../../../services/list.service";
import {List} from "../../../models/list";

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
        private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
	    // Define changed params subscription.
	    this.followersSubscription = this.route.parent.data.flatMap((data: { list: List }) => {
		    this.list = data.list;
		    return this.listService.followers(data.list.id);
	    }).subscribe((followers: User[]) => this.followers = followers);
    }
    
	ngOnDestroy(): void {
    	this.followersSubscription.unsubscribe();
	}
}
