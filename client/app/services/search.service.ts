import {Injectable} from '@angular/core';
import {Observable, ReplaySubject, Subject} from 'rxjs';
import {Router} from '@angular/router';

export enum SearchState {
	OPENED, CLOSED
}

export interface SearchEvent {
	state: SearchState;
	query: string;
}

@Injectable()
export class SearchService {
	
	onSearchEvent: Observable<SearchEvent>;
	onQueryChangedDebounced: Observable<string>;
	private searchEventSubject: Subject<SearchEvent> = new ReplaySubject(1);
	
	constructor(private router: Router) {
		// Changes that occur as soon as state changes.
		this.onSearchEvent = this.searchEventSubject.asObservable().share();
		
		// Changes that occur as soon as query changes.
		this.onQueryChangedDebounced = this.onSearchEvent.filter(expedition => expedition.state == SearchState.OPENED).map(expedition => expedition.query).distinctUntilChanged().debounceTime(500).do(query => {
			this.router.navigate(['/search', query || '']);
		}).share();
	}
	
	search(query: string): void {
		this.searchEventSubject.next({
			state: SearchState.OPENED,
			query: query
		});
	}
	
	cancel(): void {
		this.searchEventSubject.next({
			state: SearchState.CLOSED,
			query: null
		});
	}
}
