import {Component, Input, OnDestroy} from '@angular/core';
import {Rudel} from '../../../models/rudel';
import {Observable} from 'rxjs';
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
	
	constructor(private rudelService: RudelService) {
		this.suggestedRudelStream = this.rudelService.suggestRudel();
	}
	
	ngOnDestroy(): void {
	
	}
	
	markRudelAs(rudel: Rudel, markedAs: 'like' | 'dislike') {
		console.log(rudel.name + ' was marked as ' + markedAs);
	}
}
