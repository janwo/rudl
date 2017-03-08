import {DataService, JsonResponse} from "./data.service";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {List} from "../models/list";
import {Activity} from "../models/activity";
import {Event} from "../models/event";
import {Locale} from "../models/locale";
import {UserService} from "./user.service";
import Translations = Locale.Translations;

@Injectable()
export class EventService {
    
    constructor(
        private userService: UserService,
        private dataService: DataService
    ) {}
    
    create(): Observable<Event> {
        return this.dataService.post(`/api/events/create`, `${JSON.stringify({
            //TODO
        })}`, true).map((json: JsonResponse) => json.data as Event);
    }
    
    get(key: string): Observable<Event> {
        return this.dataService.get(`/api/events/=/${key}`, true).map((json: JsonResponse) => json.data as Event).share();
    }
    
    join(activity: string): Observable<Activity> {
        return this.dataService.post(`/api/activities/join/${event}`, null, true).map((json: JsonResponse) => json.data as Activity).share();
    }
    
    leave(activity: string): Observable<Activity> {
        return this.dataService.post(`/api/activities/leave/${event}`, null, true).map((json: JsonResponse) => json.data as Activity).share();
    }
    
    within(radius: number, activity: string | boolean = false): Observable<Activity[]> {
        return this.dataService.get(activity === false ? `/api/events/within/${radius}` : `/api/events/within/${radius}/in/${activity}`, true).map((json: JsonResponse) => {
            return json.data;
        }).share();
    }
    
    lists(activity: string, filter: 'all' | 'owned' | 'followed' = 'all', offset: number = 0, limit: number = 0): Observable<List[]> {
        return this.dataService.get(`/api/activities/=/${activity}/lists/${filter}/[${offset},${limit}]`, true).map((json: JsonResponse) => {
            return json.data.map((list: List) => {
                list.name = Locale.getBestTranslation(list.translations, this.userService.getAuthenticatedUser().user.languages);
                return list;
            });
        }).share();
    }
    
    by(username: string = 'me', ownsOnly: boolean = false): Observable<Activity[]> {
        return this.dataService.get(`/api/activities/by/${username}`, true).map((json: JsonResponse) => {
            return json.data.filter((activity: Activity) => !ownsOnly || activity.owner.username == username).map((activity: Activity) => {
                activity.name = Locale.getBestTranslation(activity.translations, this.userService.getAuthenticatedUser().user.languages);
                return activity;
            });
        }).share();
    }
}
