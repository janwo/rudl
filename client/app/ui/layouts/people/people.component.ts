import {Component, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {User} from "../../../models/user";
import {UserService} from "../../../services/user.service";
import {Subscription} from "rxjs";
import {Subject} from 'rxjs/Subject';
import {ScrollService} from '../../../services/scroll.service';

@Component({
    templateUrl: 'people.component.html',
    styleUrls: ['people.component.scss']
})
export class PeopleComponent implements OnInit, OnDestroy {
    
    followeesSubscription: Subscription;
    followees: User[] = [];
    suggestions: User[];
    suggestionsSubscription: Subscription;
    
    constructor(
	    private userService: UserService,
		private scrollService: ScrollService
    ) {}
	
    ngOnInit(){
    	// Suggestions.
        this.suggestionsSubscription = this.userService.suggestedPeople().subscribe((users: User[]) => this.suggestions = users);
	
	    // Followees.
        this.followeesSubscription = this.scrollService.hasScrolledToBottom().map(() => this.followees.length).startWith(0).distinct().flatMap((offset: number) => {
		    return this.userService.followees('me', offset, 25);
	    }).subscribe((users: User[]) => {
        	if(users.length < 25) this.followeesSubscription.unsubscribe();
        	this.followees = this.followees.concat(users);
        });
    }
    
    ngOnDestroy(){
        this.suggestionsSubscription.unsubscribe();
        this.followeesSubscription.unsubscribe();
    }
}
