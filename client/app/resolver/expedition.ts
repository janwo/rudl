import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, RouterStateSnapshot, Resolve} from "@angular/router";
import {Observable} from "rxjs";
import {Expedition} from "../models/expedition";
import {ExpeditionService} from "../services/expedition.service";

@Injectable()
export class ExpeditionResolver implements Resolve<Expedition> {
	
	constructor(private expeditionService: ExpeditionService) {}
	
	resolve(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<Expedition> {
		return this.expeditionService.get(route.params['expedition']);
	}
}
