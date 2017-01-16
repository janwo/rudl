import {DataService, JsonResponse} from "./data.service";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable, BehaviorSubject} from "rxjs";
import {List} from "../models/list";
import {User} from "../models/user";
import {Activity} from "../models/activity";
import {Locale} from "../models/locale";
import Translations = Locale.Translations;

export interface UserStatus {
    loggedIn: boolean;
    user: User
}

@Injectable()
export class UserService {
    
    private authenticatedProfile: BehaviorSubject<UserStatus>;

    constructor(
        private dataService: DataService,
        private router: Router
    ) {
        // Setup authenticated profile observable.
        this.authenticatedProfile = new BehaviorSubject<UserStatus>(null);
        this.getAuthenticatedUserObservable().subscribe(authenticatedUser => {
            if(authenticatedUser.loggedIn)
                console.log(`authenticatedProfile was set to: username = ${authenticatedUser.user.username}, language = ${authenticatedUser.user.languages ? authenticatedUser.user.languages[0] : 'none'}.`);
            else
                console.log(`authenticatedProfile got removed.`);
        });
        
        // Listen on token events in data service and redirect it to the authenticatedProfile observer.
        this.dataService.getTokenObservable().flatMap((tokenString: string) => {
            return tokenString ? this.getUser() : Observable.of(null);
        }).subscribe((user: User) => {
            this.authenticatedProfile.next({
                loggedIn: !!user,
                user: user
            });
        });
    }
    
    getAuthenticatedUser() : UserStatus {
        return this.authenticatedProfile.getValue();
    }
    
    getAuthenticatedUserObservable() : Observable<UserStatus> {
        return this.authenticatedProfile.asObservable().filter(user => !!user);
    }

    signUp(username: string, password: string) : void {

    }
    
    signIn(username: string, password: string) : void {
        
    }
    
    signOut() : void {
        this.dataService.get('/api/sign_out', true).subscribe(response => {
            if(response.statusCode == 200) {
                this.dataService.removeToken();
                this.authenticatedProfile.next(null);
                this.router.navigate(['/sign_up']);
            }
        });
    }
    
    getUser(username: string = 'me'): Observable<User> {
        return this.dataService.get(`/api/users/=/${username}`, true).map((json: JsonResponse) => json.data).share();
    }
    
    followersOfUser(username: string = 'me'): Observable<User[]> {
        return this.dataService.get(`/api/users/=/${username}/followers`, true).map((json: JsonResponse) => json.data).share();
    }
    
    followeesOfUser(username: string = 'me'): Observable<User[]> {
        return this.dataService.get(`/api/users/=/${username}/followees`, true).map((json: JsonResponse) => json.data).share();
    }
    
    followUser(username: string): Observable<User> {
        return this.dataService.post(`/api/users/follow/${username}`, null, true).map((json: JsonResponse) => json.data as User).share();
    }
    
    unfollowUser(username: string): Observable<User> {
        return this.dataService.post(`/api/users/unfollow/${username}`, null, true).map((json: JsonResponse) => json.data as User).share();
    }
    
    listsOfUser(username: string = null, ownsOnly: boolean = false): Observable<List[]> {
        username = username ? username : this.getAuthenticatedUser().user.username;
        return this.dataService.get(`/api/lists/by/${username}`, true).map((json: JsonResponse) => {
            return json.data.filter((list: List) => !ownsOnly || list.owner.username == username).map((list: List) => {
                list.name = Locale.getBestTranslation(list.translations, this.getAuthenticatedUser().user.languages);
                return list;
            });
        }).share();
    }
    
    getList(key: string): Observable<List> {
        return this.dataService.get(`/api/lists/=/${key}`, true).map((json: JsonResponse) => json.data as List).map((list: List) => {
            list.name = Locale.getBestTranslation(list.translations, this.getAuthenticatedUser().user.languages);
            return list;
        }).share();
    }
    
    addActivityToList(activity: Activity, list: List): Observable<void> {
        return this.dataService.post(`/api/lists/add-activity`, `${JSON.stringify({
            activity: activity.id,
            list: list.id
        })}`, true).map((json: JsonResponse) => {});
    }
    
    createList(translations: Translations, activities: Activity[] = []): Observable<List> {
        return this.dataService.post(`/api/lists/create`, `${JSON.stringify({
            translations: translations,
            activities: activities
        })}`, true).map((json: JsonResponse) => json.data as List);
    }
    
    followList(list: string): Observable<List> {
        return this.dataService.post(`/api/lists/follow/${list}`, null, true).map((json: JsonResponse) => json.data as List).share();
    }
    
    unfollowList(list: string): Observable<List> {
        return this.dataService.post(`/api/lists/unfollow/${list}`, null, true).map((json: JsonResponse) => json.data as List).share();
    }
    
    createActivity(translations: Translations): Observable<Activity> {
        return this.dataService.post(`/api/activities/create`, `${JSON.stringify({
            translations: translations
        })}`, true).map((json: JsonResponse) => json.data as Activity);
    }
    
    getActivity(key: string): Observable<Activity> {
        return this.dataService.get(`/api/activities/=/${key}`, true).map((json: JsonResponse) => json.data as Activity).map((activity: Activity) => {
            activity.name = Locale.getBestTranslation(activity.translations, this.getAuthenticatedUser().user.languages);
            return activity;
        }).share();
    }
    
    followActivity(activity: string): Observable<Activity> {
        return this.dataService.post(`/api/activities/follow/${activity}`, null, true).map((json: JsonResponse) => json.data as Activity).share();
    }
    
    unfollowActivity(activity: string): Observable<Activity> {
        return this.dataService.post(`/api/activities/unfollow/${activity}`, null, true).map((json: JsonResponse) => json.data as Activity).share();
    }
    
    activitiesOfList(list: string): Observable<Activity[]> {
        return this.dataService.get(`/api/lists/=/${list}/activities`, true).map((json: JsonResponse) => {
            return json.data.map((activity: Activity) => {
                activity.name = Locale.getBestTranslation(activity.translations, this.getAuthenticatedUser().user.languages);
                return activity;
            });
        }).share();
    }
    
    activitiesLike(query: string): Observable<Activity[]> {
        return this.dataService.get(`/api/activities/like/${query}`, true).map((json: JsonResponse) => {
            return json.data.map((activity: Activity) => {
                activity.name = Locale.getBestTranslation(activity.translations, this.getAuthenticatedUser().user.languages);
                return activity;
            });
        }).share();
    }
    
    listsLike(query: string): Observable<List[]> {
        return this.dataService.get(`/api/lists/like/${query}`, true).map((json: JsonResponse) => {
            return json.data.map((list: List) => {
                list.name = Locale.getBestTranslation(list.translations, this.getAuthenticatedUser().user.languages);
                return list;
            });
        }).share();
    }
    
    activitiesOfUser(username: string = 'me', ownsOnly: boolean = false): Observable<Activity[]> {
        return this.dataService.get(`/api/activities/by/${username}`, true).map((json: JsonResponse) => {
            return json.data.filter((activity: Activity) => !ownsOnly || activity.owner.username == username).map((activity: Activity) => {
                activity.name = Locale.getBestTranslation(activity.translations, this.getAuthenticatedUser().user.languages);
                return activity;
            });
        }).share();
    }
    
    usersLike(query: string): Observable<User[]> {
        return this.dataService.get(`/api/users/like/${query}`, true).map((json: JsonResponse) => json.data).share();
    }
    
    suggestedPeople(): Observable<User[]> {
        return this.dataService.get(`/api/suggestions/people`, true).map((json: JsonResponse) => json.data).share();
    }
}
