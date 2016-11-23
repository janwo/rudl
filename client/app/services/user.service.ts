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
    username: string;
    languages: Array<Locale.Language>;
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
        this.getAuthenticatedUserObservable().subscribe(authenticatedUser => console.log(`authenticatedProfile was set: username = ${authenticatedUser.username}, language = ${authenticatedUser.languages ? authenticatedUser.languages[0] : 'none'}.`));
        
        // Listen on token events in data service and redirect it to the authenticatedProfile observer.
        this.dataService.getTokenObservable().flatMap((tokenString: string) => tokenString ? this.getUser() : null).subscribe((user: User) => {
            this.authenticatedProfile.next({
                loggedIn: !!user,
                username: user ? user.username : null,
                languages: user ? user.languages : []
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
    
    followers(username: string = 'me'): Observable<User[]> {
        return this.dataService.get(`/api/users/followers/${username}`, true).map((json: JsonResponse) => json.data).share();
    }
    
    followees(username: string = 'me'): Observable<User[]> {
        return this.dataService.get(`/api/users/following/${username}`, true).map((json: JsonResponse) => json.data).share();
    }
    
    lists(username: string = 'me'): Observable<List[]> {
        return this.dataService.get(`/api/lists/by/${username}`, true).map((json: JsonResponse) => {
            return json.data.map((list: List) => {
                list.name = Locale.getBestTranslation(list.translations, this.getAuthenticatedUser().languages);
                return list;
            });
        }).share();
    }
    
    list(key: string): Observable<List> {
        return this.dataService.get(`/api/lists/=/${key}`, true).map((json: JsonResponse) => json.data as List).map((list: List) => {
            list.name = Locale.getBestTranslation(list.translations, this.getAuthenticatedUser().languages);
            return list;
        }).share();
    }
    
    activities(list: string): Observable<Activity[]> {
        return this.dataService.get(`/api/activities/in/${list}`, true).map((json: JsonResponse) => {
            return json.data.map((activity: Activity) => {
                activity.name = Locale.getBestTranslation(activity.translations, this.getAuthenticatedUser().languages);
                return activity;
            });
        }).share();
    }
    
    addFollowee(username: string): Observable<void> {
        return this.dataService.put(`/api/users/follow/${username}`, null, true).map(() => {}).share();
    }
    
    deleteFollowee(username: string): Observable<void> {
        return this.dataService.delete(`/api/users/follow/${username}`, true).map(() => {}).share();
    }
    
    suggestPeople(): Observable<User[]> {
        return this.dataService.get(`/api/suggestions/people`, true).map((json: JsonResponse) => json.data).share();
    }
}
