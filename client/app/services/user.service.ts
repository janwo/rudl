import {DataService, JsonResponse} from "./data.service";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable, BehaviorSubject} from "rxjs";
import {User} from "../models/user";
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
            return tokenString ? this.get() : Observable.of(null);
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
    
    get(username: string = 'me'): Observable<User> {
        return this.dataService.get(`/api/users/=/${username}`, true).map((json: JsonResponse) => json.data).share();
    }
    
    followers(username: string = 'me'): Observable<User[]> {
        return this.dataService.get(`/api/users/=/${username}/followers`, true).map((json: JsonResponse) => json.data).share();
    }
    
    followees(username: string = 'me'): Observable<User[]> {
        return this.dataService.get(`/api/users/=/${username}/followees`, true).map((json: JsonResponse) => json.data).share();
    }
    
    follow(username: string): Observable<User> {
        return this.dataService.post(`/api/users/follow/${username}`, null, true).map((json: JsonResponse) => json.data as User).share();
    }
    
    unfollow(username: string): Observable<User> {
        return this.dataService.post(`/api/users/unfollow/${username}`, null, true).map((json: JsonResponse) => json.data as User).share();
    }
    
    like(query: string): Observable<User[]> {
        return this.dataService.get(`/api/users/like/${query}`, true).map((json: JsonResponse) => json.data).share();
    }
    
    suggestedPeople(): Observable<User[]> {
        return this.dataService.get(`/api/suggestions/people`, true).map((json: JsonResponse) => json.data).share();
    }
}
