import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {ListService} from '../services/list.service';
import {List} from '../models/list';

@Injectable()
export class ListResolver implements Resolve<List> {
	
	constructor(private listService: ListService,
	            private router: Router) {}
	
	resolve(route: ActivatedRouteSnapshot,
	        state: RouterStateSnapshot): Observable<List> {
		return this.listService.get(route.params['list']).catch(() => {
			this.router.navigate(['/lists/not-found']);
			return Promise.resolve(null);
		});
		;
	}
}
