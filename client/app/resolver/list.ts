import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
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
