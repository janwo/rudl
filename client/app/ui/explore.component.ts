import {Component, Input, OnDestroy} from "@angular/core";
import {Activity} from "../models/activity";
import {UserService} from "../services/user.service";
import {Subscription, Observable} from "rxjs";

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
        private userService: UserService
    ) {
        this.suggestedActivitiesStream = Observable.empty();
        /*this.userService.activitiesOfList("888243").map((activities: Activity[]) => {
            let returnedOnes: Activity[] = [];
            activities.forEach(activity => {
                for(let i = 0; i < 10; i++){
                    activity = JSON.parse(JSON.stringify(activity));
                    activity.name += ' id: ' + i;
                    returnedOnes.push(activity);
                }
            });
            return returnedOnes;
        });TODO*/
    }
    
    ngOnDestroy(): void {
        
    }
    
    markActivityAs(activity: Activity, markedAs: 'like' | 'dislike') {
       console.log(activity.name + ' was marked as ' + markedAs);
    }
    
    createList(name: string) {
        this.userService.createList({de: name}).subscribe();
    }
}
