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
        private dataService: DataService,
        private userService: UserService
    ) {}
    
    create(recipe: ExpeditionRecipe, rudel: Rudel): Observable<Expedition> {
        return this.dataService.post(`/api/expeditions/create`, JSON.stringify({
            rudel: rudel.id,
            expedition: recipe
        }), true).map((json: JsonResponse) => json.data as Expedition);
    }
    
    get(key: string): Observable<Expedition> {
        return this.dataService.get(`/api/expeditions/=/${key}`, true).map((json: JsonResponse) => this.handleExpeditionResponse(json.data)).share();
    }
    
    join(expedition: string): Observable<Expedition> {
        return this.dataService.post(`/api/expeditions/join/${expedition}`, null, true).map((json: JsonResponse) => this.handleExpeditionResponse(json.data)).share();
    }
    
    attendees(expedition: string, offset = 0): Observable<User[]> {
        return this.dataService.get(`/api/expeditions/=/${expedition}/attendees/${offset}`, true).map((json: JsonResponse) => json.data as User[]).share();
    }
    
    leave(expedition: string): Observable<Expedition> {
        return this.dataService.post(`/api/expeditions/leave/${expedition}`, null, true).map((json: JsonResponse) => this.handleExpeditionResponse(json.data)).share();
    }
    
    nearby(rudel: string | boolean = false): Observable<Expedition[]> {
        return this.dataService.get(rudel === false ? `/api/expeditions/nearby` : `/api/expeditions/near/${rudel}`, true).map((json: JsonResponse) => this.handleExpeditionResponse(json.data)).share();
    }
    
    by(username: string = 'me'): Observable<Expedition[]> {
        return this.dataService.get(`/api/expeditions/by/${username}`, true).map((json: JsonResponse) => this.handleExpeditionResponse(json.data)).share();
    }
    
    private handleExpeditionResponse(data: any | any[]): Expedition | Expedition[] {
        let handleExpedition = (expedition: Expedition) => {
            expedition.rudel.name = Locale.getBestTranslation(expedition.rudel.translations, this.userService.getAuthenticatedUser().user.languages);
            return expedition;
        };
        return data instanceof Array ? data.map(item => handleExpedition(item)) : handleExpedition(data);
    }
}
