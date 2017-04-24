import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from "@angular/router";
import {ActivityService} from "../services/activity.service";
import {Activity} from "../models/activity";
import {Observable} from "rxjs";

@Injectable()
export class ActivityResolver implements Resolve<Activity> {
	
	constructor(
		private activityService: ActivityService,
		private router: Router
	) {}
	
	resolve(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<Activity> {
		return this.activityService.get(route.params['activity']).catch(() => {
			this.router.navigate(['/rudel/not-found']);
			return Promise.resolve(null);
		});
	}
}
