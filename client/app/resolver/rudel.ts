import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from "@angular/router";
import {RudelService} from "../services/rudel.service";
import {Rudel} from "../models/rudel";
import {Observable} from "rxjs";

@Injectable()
export class RudelResolver implements Resolve<Rudel> {
	
	constructor(
		private rudelService: RudelService,
		private router: Router
	) {}
	
	resolve(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<Rudel> {
		return this.rudelService.get(route.params['rudel']).catch(() => {
			this.router.navigate(['/rudel/not-found']);
			return Promise.resolve(null);
		});
	}
}
