import {DataService, JsonResponse} from "./data.service";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable, BehaviorSubject, ReplaySubject} from "rxjs";
import {List} from "../models/list";
import {User} from "../models/user";
import {Activity} from "../models/activity";

export interface AuthenticatedUser {
    username: string;
    language: Array<string>;
}

@Injectable()
export class UserService {
    
    private authenticatedProfile: ReplaySubject<AuthenticatedUser>;

    constructor(
        private dataService: DataService,
        private router: Router
    ) {
        // Setup authenticated profile observable.
        this.authenticatedProfile = new ReplaySubject<AuthenticatedUser>(1);
        this.authenticatedProfile.asObservable().subscribe(authenticatedUser => {
            console.log('userProfile in UserService set to ' + JSON.stringify(authenticatedUser));
        });
        
        // Listen on token events in data service.
        this.dataService.getTokenObservable().flatMap((tokenString: string) => this.getUser()).subscribe((user: User) => {
            this.authenticatedProfile.next({
                username: user.username,
                language: [
                    'en-US'
                ]
            });
        });
    }
    
    getAuthenticatedUser() : Observable<AuthenticatedUser> {
        return this.authenticatedProfile.asObservable();
    }

    signUp(username: string, password: string) {

    }
    
    signIn(username: string, password: string) {
        
    }
    
    signOut() {
        this.dataService.get('/api/sign_out', true).subscribe(response => {
            if(response.statusCode == 200) {
                this.dataService.removeToken();
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
        return this.dataService.get(`/api/lists/by/${username}`, true).map((json: JsonResponse) => json.data).share();
    }
    
    list(key: string): Observable<List> {
        return this.dataService.get(`/api/lists/=/${key}`, true).map((json: JsonResponse) => json.data).share();
    }
    
    activities(list: string): Observable<Activity[]> {
        return this.dataService.get(`/api/activities/in/${list}`, true).map((json: JsonResponse) => json.data).share();
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
