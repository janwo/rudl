import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, RouterStateSnapshot, Resolve, Params} from "@angular/router";
import {ActivityService} from "../services/activity.service";
import {Activity} from "../models/activity";
import {Observable} from "rxjs";
import {ListService} from "../services/list.service";
import {List} from "../models/list";

@Injectable()
export class ListResolver implements Resolve<List> {
	
	constructor(private listService: ListService) {}
	
	resolve(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<List> {
		return this.listService.get(route.params['list']);
	}
}
