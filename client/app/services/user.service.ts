import {DataService, JsonResponse} from "./data.service";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable, BehaviorSubject} from "rxjs";
import {List} from "../models/list";
import {User} from "../models/user";
import {Activity} from "../models/activity";
import {Locale} from "../models/locale";

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
        this.dataService.get('/api/sign-out', true).subscribe(response => {
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
    
    followers(username: string = 'me'): Observable<User[]> {
        return this.dataService.get(`/api/users/followers/${username}`, true).map((json: JsonResponse) => json.data).share();
    }
    
    followees(username: string = 'me'): Observable<User[]> {
        return this.dataService.get(`/api/users/following/${username}`, true).map((json: JsonResponse) => json.data).share();
    }
    
    followUser(username: string): Observable<User> {
        return this.dataService.put(`/api/users/follow/${username}`, null, true).map((json: JsonResponse) => json.data as User).share();
    }
    
    unfollowUser(username: string): Observable<User> {
        return this.dataService.delete(`/api/users/follow/${username}`, true).map((json: JsonResponse) => json.data as User).share();
    }
    
    lists(username: string = 'me'): Observable<List[]> {
        return this.dataService.get(`/api/lists/by/${username}`, true).map((json: JsonResponse) => {
            return json.data.map((list: List) => {
                list.name = Locale.getBestTranslation(list.translations, this.getAuthenticatedUser().user.languages);
                return list;
            });
        }).share();
    }
    
    list(key: string): Observable<List> {
        return this.dataService.get(`/api/lists/=/${key}`, true).map((json: JsonResponse) => json.data as List).map((list: List) => {
            list.name = Locale.getBestTranslation(list.translations, this.getAuthenticatedUser().user.languages);
            return list;
        }).share();
    }
    
    followList(listId: string): Observable<List> {
        return this.dataService.put(`/api/lists/follow/${listId}`, null, true).map((json: JsonResponse) => json.data as List).share();
    }
    
    unfollowList(listId: string): Observable<List> {
        return this.dataService.delete(`/api/lists/follow/${listId}`, true).map((json: JsonResponse) => json.data as List).share();
    }
    
    activities(list: string): Observable<Activity[]> {
        return this.dataService.get(`/api/activities/in/${list}`, true).map((json: JsonResponse) => {
            return json.data.map((activity: Activity) => {
                activity.name = Locale.getBestTranslation(activity.translations, this.getAuthenticatedUser().user.languages);
                return activity;
            });
        }).share();
    }
    
    suggestPeople(): Observable<User[]> {
        return this.dataService.get(`/api/suggestions/people`, true).map((json: JsonResponse) => json.data).share();
    }
}
