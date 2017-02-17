import {DataService, JsonResponse} from "./data.service";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable, BehaviorSubject} from "rxjs";
import {List} from "../models/list";
import {User} from "../models/user";
import {Activity} from "../models/activity";
import {Locale} from "../models/locale";
import Translations = Locale.Translations;
import {UserService} from "./user.service";

@Injectable()
export class ListService {
    
    constructor(
        private userService: UserService,
        private dataService: DataService
    ) {}
    
    get(key: string): Observable<List> {
        return this.dataService.get(`/api/lists/=/${key}`, true).map((json: JsonResponse) => json.data as List).map((list: List) => {
            list.name = Locale.getBestTranslation(list.translations, this.userService.getAuthenticatedUser().user.languages);
            return list;
        }).share();
    }
    
    addActivity(activity: string, list: string): Observable<void> {
        return this.dataService.post(`/api/lists/add-activity`, `${JSON.stringify({
            activity: activity,
            list: list
        })}`, true).map((json: JsonResponse) => {});
    }
    
    deleteActivity(activity: string, list: string): Observable<void> {
        return this.dataService.post(`/api/lists/delete-activity`, `${JSON.stringify({
            activity: activity,
            list: list
        })}`, true).map((json: JsonResponse) => {});
    }
    
    create(translations: Translations, activities: string[] = []): Observable<List> {
        return this.dataService.post(`/api/lists/create`, `${JSON.stringify({
            translations: translations,
            activities: activities
        })}`, true).map((json: JsonResponse) => json.data as List);
    }
    
    follow(list: string): Observable<List> {
        return this.dataService.post(`/api/lists/follow/${list}`, null, true).map((json: JsonResponse) => json.data as List).share();
    }
    
    unfollow(list: string): Observable<List> {
        return this.dataService.post(`/api/lists/unfollow/${list}`, null, true).map((json: JsonResponse) => json.data as List).share();
    }
    
    activities(list: string, filter: 'all' | 'owned' | 'followed' = 'all', offset: number = 0, limit: number = 0): Observable<Activity[]> {
        return this.dataService.get(`/api/lists/=/${list}/activities/${filter}/[${offset},${limit}]`, true).map((json: JsonResponse) => {
            return json.data.map((activity: Activity) => {
                activity.name = Locale.getBestTranslation(activity.translations, this.userService.getAuthenticatedUser().user.languages);
                return activity;
            });
        }).share();
    }
    
    like(query: string): Observable<List[]> {
        return this.dataService.get(`/api/lists/like/${query}`, true).map((json: JsonResponse) => {
            return json.data.map((list: List) => {
                list.name = Locale.getBestTranslation(list.translations, this.userService.getAuthenticatedUser().user.languages);
                return list;
            });
        }).share();
    }
    
    by(username: string = null, ownsOnly: boolean = false): Observable<List[]> {
        username = username ? username : this.userService.getAuthenticatedUser().user.username;
        return this.dataService.get(`/api/lists/by/${username}`, true).map((json: JsonResponse) => {
            return json.data.filter((list: List) => !ownsOnly || list.owner.username == username).map((list: List) => {
                list.name = Locale.getBestTranslation(list.translations, this.userService.getAuthenticatedUser().user.languages);
                return list;
            });
        }).share();
    }
}
