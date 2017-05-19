import {Component, Input, OnDestroy} from "@angular/core";
import {Rudel} from "../../../models/rudel";
import {Observable} from "rxjs";
import {ListService} from "../../../services/list.service";
import {ExpeditionService} from '../../../services/expedition.service';
import {Expedition} from '../../../models/expedition';
import {RudelService} from '../../../services/rudel.service';

export enum UserSuggestionsType {
    GENERAL, NEARBY
}

@Component({
    templateUrl: 'explore.component.html',
    styleUrls: ['explore.component.scss']
})
export class ExploreComponent implements OnDestroy {
    
    @Input() type: UserSuggestionsType = UserSuggestionsType.GENERAL;
    suggestedRudelStream: Observable<Rudel[]>;

    constructor(
        private rudelService: RudelService
    ) {
        this.suggestedRudelStream = this.rudelService.suggestRudel();
    }
    
    ngOnDestroy(): void {
    
    }
    
    markActivityAs(rudel: Rudel, markedAs: 'like' | 'dislike') {
       console.log(rudel.name + ' was marked as ' + markedAs);
    }
}
