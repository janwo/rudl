import {DataService, JsonResponse} from "./data.service";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {List} from "../models/list";
import {Activity, ActivityRecipe} from "../models/activity";
import {Locale} from "../models/locale";
import {UserService} from "./user.service";
import {User} from "../models/user";
import Translations = Locale.Translations;

@Injectable()
export class ActivityService {
    
    constructor(
        private userService: UserService,
        private dataService: DataService
    ) {}
    
    create(recipe: ActivityRecipe): Observable<Activity> {
        return this.dataService.post(`/api/activities/create`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as Activity);
    }
    
    get(key: string): Observable<Activity> {
        return this.dataService.get(`/api/activities/=/${key}`, true).map((json: JsonResponse) => json.data as Activity).map((activity: Activity) => {
            activity.name = Locale.getBestTranslation(activity.translations, this.userService.getAuthenticatedUser().user.languages);
            return activity;
        }).share();
    }
    
    follow(activity: string): Observable<Activity> {
        return this.dataService.post(`/api/activities/follow/${activity}`, null, true).map((json: JsonResponse) => json.data as Activity).share();
    }
    
    followers(activity: string): Observable<User[]> {
        return this.dataService.get(`/api/activities/=/${activity}/followers`, true).map((json: JsonResponse) => json.data as User[]).share();
    }
    
    unfollow(activity: string): Observable<Activity> {
        return this.dataService.post(`/api/activities/unfollow/${activity}`, null, true).map((json: JsonResponse) => json.data as Activity).share();
    }
    
    like(query: string): Observable<Activity[]> {
        return this.dataService.get(`/api/activities/like/${query}`, true).map((json: JsonResponse) => {
            return json.data.map((activity: Activity) => {
                activity.name = Locale.getBestTranslation(activity.translations, this.userService.getAuthenticatedUser().user.languages);
                return activity;
            });
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
