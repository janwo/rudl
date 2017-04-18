import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {ActivityService} from "../services/activity.service";
import {Activity} from "../models/activity";
import {Observable} from "rxjs";

@Injectable()
export class ActivityResolver implements Resolve<Activity> {
	
	constructor(private activityService: ActivityService) {}
	
	resolve(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<Activity> {
		return this.activityService.get(route.params['activity']);
	}
}
