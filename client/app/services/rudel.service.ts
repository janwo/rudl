import {DataService, JsonResponse} from "./data.service";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {List} from "../models/list";
import {Rudel, RudelRecipe} from "../models/rudel";
import {Locale} from "../models/locale";
import {UserService} from "./user.service";
import {User} from "../models/user";
import Translations = Locale.Translations;

@Injectable()
export class RudelService {
    
    constructor(
        private userService: UserService,
        private dataService: DataService
    ) {}
    
    create(recipe: RudelRecipe): Observable<Rudel> {
        return this.dataService.post(`/api/rudel/create`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as Rudel);
    }
    
    update(key: string, recipe: RudelRecipe): Observable<Rudel> {
        //TODO Partielles updaten implementieren
        return this.dataService.post(`/api/rudel/=/${key}/update`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as Rudel);
    }
    
    get(key: string): Observable<Rudel> {
        return this.dataService.get(`/api/rudel/=/${key}`, true).map((json: JsonResponse) => json.data as Rudel).map((rudel: Rudel) => {
            rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
            return rudel;
        }).share();
    }
    
    followers(rudel: string): Observable<User[]> {
        return this.dataService.get(`/api/rudel/=/${rudel}/followers`, true).map((json: JsonResponse) => json.data as User[]).share();
    }
    
    follow(rudel: string): Observable<Rudel> {
        return this.dataService.post(`/api/rudel/follow/${rudel}`, null, true).map((json: JsonResponse) => json.data as Rudel).map((rudel: Rudel) => {
            rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
            return rudel;
        }).share();
    }
    
    unfollow(rudel: string): Observable<Rudel> {
        return this.dataService.post(`/api/rudel/unfollow/${rudel}`, null, true).map((json: JsonResponse) => json.data as Rudel).map((rudel: Rudel) => {
	        if(rudel) rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
	        return rudel;
        }).share();
    }
    
    like(query: string): Observable<Rudel[]> {
        return this.dataService.get(`/api/rudel/like/${query}`, true).map((json: JsonResponse) => {
            return json.data.map((rudel: Rudel) => {
                rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
                return rudel;
            });
        }).share();
    }
    
    lists(rudel: string, offset: number = 0): Observable<List[]> {
        return this.dataService.get(`/api/rudel/=/${rudel}/lists/${offset}`, true).map((json: JsonResponse) => {
            return json.data.map((list: List) => {
                list.name = Locale.getBestTranslation(list.translations, this.userService.getAuthenticatedUser().user.languages);
                return list;
            });
        }).share();
    }
    
    by(username: string = 'me', ownsOnly: boolean = false): Observable<Rudel[]> {
        return this.dataService.get(`/api/rudel/by/${username}`, true).map((json: JsonResponse) => {
            return json.data.filter((rudel: Rudel) => !ownsOnly || rudel.owner.username == username).map((rudel: Rudel) => {
                rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
                return rudel;
            });
        }).share();
    }
    
    suggestActivities(): Observable<Rudel[]> {
        return this.dataService.get(`/api/suggestions/rudel`, true).map((json: JsonResponse) => {
            return json.data.filter((rudel: Rudel) => {
                rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
                return rudel;
            });
        }).share();
    }
}
