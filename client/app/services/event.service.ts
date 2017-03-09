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
    
    nearby(activity: string | boolean = false): Observable<Event[]> {
        return this.dataService.get(activity === false ? `/api/events/nearby` : `/api/events/nearby/${activity}`, true).map((json: JsonResponse) => {
            return json.data;
        }).share();
    }
    
    by(username: string = 'me', activity: string | boolean = false): Observable<Event[]> {
        return this.dataService.get(activity ? `/api/events/by/${username}/in/${activity}`: `/api/events/by/${username}`, true).map((json: JsonResponse) => {
            return json.data;
        }).share();
    }
}
