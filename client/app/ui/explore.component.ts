import {Component, Input, OnDestroy} from "@angular/core";
import {Activity} from "../models/activity";
import {UserService} from "../services/user.service";
import {Subscription, Observable} from "rxjs";
import {ListService} from "../services/list.service";

export enum UserSuggestionsType {
    GENERAL, NEARBY
}

@Component({
    templateUrl: './explore.component.html',
    styleUrls: ['./explore.component.scss']
})
export class ExploreComponent implements OnDestroy {
    
    @Input() type: UserSuggestionsType = UserSuggestionsType.GENERAL;
    suggestedActivitiesStream: Observable<Activity[]>;

    constructor(
        private listService: ListService
    ) {
        this.suggestedActivitiesStream = Observable.empty();//this.listService.activities("4026794");//TODO
    }
    
    ngOnDestroy(): void {
        
    }
    
    markActivityAs(activity: Activity, markedAs: 'like' | 'dislike') {
       console.log(activity.name + ' was marked as ' + markedAs);
    }
}
