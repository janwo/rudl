import {DataService, JsonResponse} from "./data.service";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {Locale} from "../models/locale";
import {UserService} from "./user.service";
import {Expedition, ExpeditionRecipe} from "../models/expedition";
import Translations = Locale.Translations;
import {Rudel} from '../models/rudel';
import {User} from '../models/user';

@Injectable()
export class ExpeditionService {
    
    constructor(
        private dataService: DataService
    ) {}
    
    create(recipe: ExpeditionRecipe, rudel: Rudel): Observable<Expedition> {
        return this.dataService.post(`/api/expeditions/create`, JSON.stringify({
            rudel: rudel.id,
            expedition: recipe
        }), true).map((json: JsonResponse) => json.data as Expedition);
    }
    
    get(key: string): Observable<Expedition> {
        return this.dataService.get(`/api/expeditions/=/${key}`, true).map((json: JsonResponse) => json.data as Expedition).share();
    }
    
    join(expedition: string): Observable<Expedition> {
        return this.dataService.post(`/api/expeditions/join/${expedition}`, null, true).map((json: JsonResponse) => json.data as Expedition).share();
    }
    
    attendees(expedition: string, offset = 0): Observable<User[]> {
        return this.dataService.post(`/api/expeditions/=/${expedition}/attendees/${offset}`, null, true).map((json: JsonResponse) => json.data as User[]).share();
    }
    
    leave(expedition: string): Observable<Expedition> {
        return this.dataService.post(`/api/expeditions/leave/${expedition}`, null, true).map((json: JsonResponse) => json.data as Expedition).share();
    }
    
    nearby(rudel: string | boolean = false): Observable<Expedition[]> {
        return this.dataService.get(rudel === false ? `/api/expeditions/nearby` : `/api/expeditions/nearby/${rudel}`, true).map((json: JsonResponse) => {
            return json.data;
        }).share();
    }
    
    by(username: string = 'me', rudel: string | boolean = false): Observable<Expedition[]> {
        return this.dataService.get(rudel ? `/api/expeditions/by/${username}/in/${rudel}`: `/api/expeditions/by/${username}`, true).map((json: JsonResponse) => {
            return json.data;
        }).share();
    }
}