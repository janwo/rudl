import {DataService, JsonResponse} from "./data.service";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {Locale} from "../models/locale";
import {UserService} from "./user.service";
import {Expedition, ExpeditionRecipe} from "../models/expedition";
import Translations = Locale.Translations;

@Injectable()
export class ExpeditionService {
    
    constructor(
        private userService: UserService,
        private dataService: DataService
    ) {}
    
    create(recipe: ExpeditionRecipe): Observable<Expedition> {
        return this.dataService.post(`/api/expeditions/create`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as Expedition);
    }
    
    get(key: string): Observable<Expedition> {
        return this.dataService.get(`/api/expeditions/=/${key}`, true).map((json: JsonResponse) => json.data as Expedition).share();
    }
    
    join(expedition: string): Observable<Expedition> {
        return this.dataService.post(`/api/expeditions/join/${expedition}`, null, true).map((json: JsonResponse) => json.data as Expedition).share();
    }
    
    leave(expedition: string): Observable<Expedition> {
        return this.dataService.post(`/api/expeditions/leave/${expedition}`, null, true).map((json: JsonResponse) => json.data as Expedition).share();
    }
    
    nearby(activity: string | boolean = false): Observable<Expedition[]> {
        return this.dataService.get(activity === false ? `/api/expedition/nearby` : `/api/expeditions/nearby/${activity}`, true).map((json: JsonResponse) => {
            return json.data;
        }).share();
    }
    
    by(username: string = 'me', activity: string | boolean = false): Observable<Expedition[]> {
        return this.dataService.get(activity ? `/api/expeditions/by/${username}/in/${activity}`: `/api/expeditions/by/${username}`, true).map((json: JsonResponse) => {
            return json.data;
        }).share();
    }
}
