import {Component, Input, OnDestroy} from "@angular/core";
import {Activity} from "../../../models/activity";
import {Observable} from "rxjs";
import {ListService} from "../../../services/list.service";
import {ExpeditionService} from '../../../services/expedition.service';
import {Expedition} from '../../../models/expedition';
import {ActivityService} from '../../../services/activity.service';

export enum UserSuggestionsType {
    GENERAL, NEARBY
}

@Component({
    templateUrl: 'explore.component.html',
    styleUrls: ['explore.component.scss']
})
export class ExploreComponent implements OnDestroy {
    
    @Input() type: UserSuggestionsType = UserSuggestionsType.GENERAL;
    suggestedActivityStream: Observable<Activity[]>;

    constructor(
        private activityService: ActivityService
    ) {
        this.suggestedActivityStream = this.activityService.suggestActivities();
    }
    
    ngOnDestroy(): void {
    
    }
    
    markActivityAs(activity: Activity, markedAs: 'like' | 'dislike') {
       console.log(activity.name + ' was marked as ' + markedAs);
    }
}
