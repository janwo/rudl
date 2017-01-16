import {Injectable} from "@angular/core";
import {Subject, BehaviorSubject, Observable, ReplaySubject} from "rxjs";
import {Router, Params, ActivatedRoute} from "@angular/router";
import {Location} from "@angular/common";

export enum SearchState {
    OPENED, CLOSED
}

@Injectable()
export class SearchService {
    
    onStateChanged: Observable<SearchState>;
    onQueryChanged: Observable<string>;
    onQueryChangedDebounced: Observable<string>;
    private changeState: Subject<SearchState> = new ReplaySubject(1);
    private changeQuery: Subject<string> = new ReplaySubject(1);
    private lastUrl: string;
    
    constructor(
        private location: Location,
        private router: Router
    ){
        // Changes that occur as soon as state changes.
        this.onStateChanged = this.changeState.asObservable().distinctUntilChanged().do(state => {
            switch(state) {
                case SearchState.OPENED:
                    let isSearchRouteActive = this.router.isActive(this.router.createUrlTree(['/search', '']), false);
                    
                    // Save last url.
                    this.lastUrl = isSearchRouteActive ? null : this.location.path(true);
                
                    // Navigate to search component, if not done already.
                    if(!isSearchRouteActive) this.router.navigate(['/search', '']);
                    break;
            
                case SearchState.CLOSED:
                    // Navigate to last url.
                    if(this.lastUrl) //TODO ELEGANTER hier machen
                        this.router.navigateByUrl(this.lastUrl);
                    else
                        this.router.navigate(['/']);
                    break;
            }
        }).share();
    
        // Changes that occur as soon as query changes.
        this.onQueryChanged = this.changeQuery.asObservable().distinctUntilChanged().map(query => !!query ? query : null);
        this.onQueryChangedDebounced = this.onQueryChanged.debounceTime(1000).do(query => {
            // Update url.
            this.router.navigate(['/search', query ? query : '']);
        }).share();
    }
    
    search(query: string): void {
        // Open search, if not opened already.
        this.start();
        
        // Set query.
        this.changeQuery.next(query);
    }
    
    start(): void {
        this.changeState.next(SearchState.OPENED);
    }
    
    cancel(): void {
        this.changeState.next(SearchState.CLOSED);
        this.changeQuery.next(null);
    }
}
