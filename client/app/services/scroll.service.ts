import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Subject} from 'rxjs/Subject';

@Injectable()
export class ScrollService {
	
	private scrolled: Subject<Event> = new Subject();
	
	scrolledToBottom(event: Event): void {
		this.scrolled.next(event);
	}
	
	hasScrolledToBottom() : Observable<Event> {
		return this.scrolled.asObservable();
	}
}
