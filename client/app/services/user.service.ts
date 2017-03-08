import {DataService, JsonResponse} from "./data.service";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable, BehaviorSubject, Observer, Subject, ReplaySubject} from "rxjs";
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
    private locationUpdate: ReplaySubject<Position> = new ReplaySubject(1);
    private locationUpdateCallerId: number | false = false;

    constructor(
        private dataService: DataService,
        private router: Router
    ) {
        // Setup authenticated profile observable.
        this.authenticatedProfile = new BehaviorSubject<UserStatus>(null);
        this.getAuthenticatedUserObservable().subscribe(authenticatedUser => {
            if(authenticatedUser.loggedIn) {
                console.log(`authenticatedProfile was set to: username = ${authenticatedUser.user.username}, language = ${authenticatedUser.user.languages ? authenticatedUser.user.languages[0] : 'none'}.`);
                
                // Request position updates immediately if user is boarded.
                if(authenticatedUser.user.meta.onBoard && this.locationUpdateCallerId === false) this.requestPositionUpdates();
            } else
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
    
    requestPositionUpdates(): void {
        this.cancelPositionUpdates();
        this.locationUpdateCallerId = navigator.geolocation.watchPosition((position: Position) => {
                this.updateLocation(position.coords.longitude, position.coords.latitude).subscribe(() => {
                    this.locationUpdate.next(position);
                });
            }, (error: PositionError) => {
                console.log('Geolocation service: ' + error.message);
                this.locationUpdate.error(error);
            },{
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 1000 * 60
            }
        );
    }
    
    cancelPositionUpdates(): void {
        if(this.locationUpdateCallerId !== false) {
            navigator.geolocation.clearWatch(this.locationUpdateCallerId);
            this.locationUpdateCallerId = false;
        }
    }
    
    getCurrentPosition(): Observable<Position> {
        return this.locationUpdate.asObservable().share();
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
    
    updateLocation(longitude: number, latitude: number): Observable<User[]> {
        return this.dataService.post(`/api/account/location`, `${JSON.stringify({
            longitude: longitude,
            latitude: latitude
        })}`, true).map((json: JsonResponse) => json.data).do(user => this.authenticatedProfile.next({
            loggedIn: !!user,
            user: user
        })).share();
    }
    
    updateBoarding(boarded: boolean): Observable<User[]> {
        return this.dataService.post(`/api/account/boarding`, `${JSON.stringify({
            boarded: boarded
        })}`, true).map((json: JsonResponse) => json.data).do(user => this.authenticatedProfile.next({
            loggedIn: !!user,
            user: user
        })).share();
    }
    
    suggestedPeople(): Observable<User[]> {
        return this.dataService.get(`/api/suggestions/people`, true).map((json: JsonResponse) => json.data).share();
    }
}
