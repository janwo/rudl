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
    
    private authenticatedProfile: BehaviorSubject<UserStatus> = new BehaviorSubject<UserStatus>(null);
    private authenticatedProfileObservable: Observable<UserStatus>= this.authenticatedProfile.asObservable().filter(user => !!user);
    private currentLocation: ReplaySubject<Position> = new ReplaySubject(1);
    private locationUpdates: Observable<[number, number]> = this.currentLocation.asObservable().do(position => console.log(position)).flatMap((position: Position) => {
        let userStatus = this.getAuthenticatedUser();
        
        // It's an location update?
        if(userStatus.user.location) {
            let usersLat = userStatus.user.location[0];
            let usersLon = userStatus.user.location[1];
    
            // Calculate distance.
            let pi = Math.PI / 180;
            let a = 0.5 - Math.cos((usersLat - position.coords.latitude) * pi) / 2 + Math.cos(position.coords.latitude * pi)
                * Math.cos(usersLat * pi) * (1 - Math.cos((usersLon - position.coords.longitude) * pi)) / 2;
            let distance = 6371 * Math.asin(Math.sqrt(a)) * 2;
           
            // Just return Update location, return position.
            console.log(distance);
            if (distance <= 0.1) return Observable.of(userStatus.user.location); // Accuracy of 100 meters.
        }
    
        return this.updateLocation(position.coords.latitude, position.coords.longitude).map(user => user.location);
    });
    
    private watchPositionCallerId: number | false = false;

    constructor(
        private dataService: DataService,
        private router: Router
    ) {
        // Setup authenticated profile observable.
        this.getAuthenticatedUserObservable().subscribe(authenticatedUser => {
            if(authenticatedUser.loggedIn) {
                console.log(`authenticatedProfile was set to: username = ${authenticatedUser.user.username}, language = ${authenticatedUser.user.languages ? authenticatedUser.user.languages[0] : 'none'}.`);
                
                // Request position updates immediately if user is boarded.
                if(authenticatedUser.user.meta.onBoard && this.watchPositionCallerId === false) this.resumePositionUpdates();
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
        return this.authenticatedProfileObservable;
    }
    
    resumePositionUpdates(): void {
        this.pausePositionUpdates();
        this.watchPositionCallerId = this.watchPositionCallerId = navigator.geolocation.watchPosition((position: Position) => {
            this.currentLocation.next(position);
            }, (error: PositionError) => {
                this.currentLocation.error(error);
            }, {
                enableHighAccuracy: false,
                maximumAge: 1000 * 60,
                timeout: 1000 * 60
            }
        );
    }
    
    pausePositionUpdates(): void {
        if(this.watchPositionCallerId !== false) {
            navigator.geolocation.clearWatch(this.watchPositionCallerId);
            this.watchPositionCallerId = false;
        }
    }
    
    getCurrentPosition(): Observable<[number, number]> {
        return this.locationUpdates;
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
    
    updateLocation(latitude: number, longitude: number): Observable<User> {
        return this.dataService.post(`/api/account/location`, `${JSON.stringify({
            longitude: longitude,
            latitude: latitude
        })}`, true).map((json: JsonResponse) => json.data).do(user => this.authenticatedProfile.next({
            loggedIn: !!user,
            user: user
        })).share();
    }
    
    updateBoarding(boarded: boolean): Observable<User> {
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
