import {DataService, JsonResponse} from './data.service';
import {Router} from '@angular/router';
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';
import {AuthenticatedUser, User, UserRecipe, UserSettings, UserSettingsRecipe} from '../models/user';
import {Location} from '../models/location';
import {Notification} from '../models/notification';

export interface UserStatus {
	loggedIn: boolean;
	user: AuthenticatedUser
}

@Injectable()
export class UserService {
	
	private authenticatedProfile: BehaviorSubject<UserStatus> = new BehaviorSubject<UserStatus>(null);
	private authenticatedProfileObservable: Observable<UserStatus> = this.authenticatedProfile.asObservable().filter(user => !!user);
	private currentLocation: ReplaySubject<Position> = new ReplaySubject(1);
	private locationUpdates: Observable<Location> = this.currentLocation.asObservable().flatMap((position: Position) => {
		let location: Location = {
			lat: position.coords.latitude,
			lng: position.coords.longitude
		};
		
		// Just return current location, if new location is less than 100 meters away.
		let distance = this.getUsersDistance(location);
		if (distance <= 100) return Observable.of(this.getAuthenticatedUser().user.location);
		
		console.log(`Updating user location (Δ: ${distance} meters)...`);
		return this.updateLocation(location).map(user => user.location);
	}).share();
	
	private watchPositionCallerId: number | false = false;
	
	constructor(private dataService: DataService,
	            private router: Router) {
		// Setup authenticated profile observable.
		this.getAuthenticatedUserObservable().subscribe(authenticatedUser => {
			if (authenticatedUser.loggedIn) {
				console.log(`authenticatedProfile was set to: username = ${authenticatedUser.user.username}, language = ${authenticatedUser.user.languages ? authenticatedUser.user.languages[0] : 'none'}.`);
				
				// Request position updates immediately if user is boarded.
				if (authenticatedUser.user.onBoard) this.resumePositionUpdates();
			} else {
				console.log(`authenticatedProfile got removed.`);
				this.pausePositionUpdates();
			}
		});
		
		// Listen on token expeditions in data service and redirect it to the authenticatedProfile observer.
		this.dataService.getTokenObservable().switchMap((tokenString: string) => {
			return tokenString ? this.get().repeatWhen(notifications => notifications.delay(300000)) : Observable.of(null);
		}).distinctUntilChanged((user: AuthenticatedUser) => !!user).subscribe((user: AuthenticatedUser) => {
			this.authenticatedProfile.next({
				loggedIn: !!user,
				user: user
			});
		});
		
		// Subscribe to location updates.
		this.locationUpdates.subscribe();
	}
	
	getUsersDistance(location: Location): number {
		let userStatus = this.getAuthenticatedUser();
		if (!userStatus.user || !userStatus.user.location) return NaN;
		
		// Calculate distance.
		let pi = Math.PI / 180;
		let R = 6378137; // Earth’s radius
		let a = 0.5 - Math.cos((userStatus.user.location.lat - location.lat) * pi) / 2 + Math.cos(location.lng * pi)
			* Math.cos(userStatus.user.location.lat * pi) * (1 - Math.cos((userStatus.user.location.lng - location.lng) * pi)) / 2;
		return Math.floor(R * Math.asin(Math.sqrt(a)) * 2);
	}
	
	getAuthenticatedUser(): UserStatus {
		return this.authenticatedProfile.getValue();
	}
	
	getAuthenticatedUserObservable(): Observable<UserStatus> {
		return this.authenticatedProfileObservable;
	}
	
	resumePositionUpdates(): void {
		if(this.watchPositionCallerId !== false) return;
		console.log('Resume position updates...');
		this.watchPositionCallerId = navigator.geolocation.watchPosition((position: Position) => {
			this.currentLocation.next(position);
		}, (error: PositionError) => {
			this.currentLocation.error(error);
		}, {
			enableHighAccuracy: false,
			maximumAge: 1000 * 60,
			timeout: 1000 * 60
		});
	}
	
	pausePositionUpdates(): void {
		if (this.watchPositionCallerId !== false) {
			console.log('Pause position updates...');
			navigator.geolocation.clearWatch(this.watchPositionCallerId);
			this.watchPositionCallerId = false;
		}
	}
	
	getCurrentPosition(): Observable<Location> {
		return this.locationUpdates;
	}
	
	signUp(username: string, password: string): void {
	
	}
	
	signIn(username: string, password: string): void {
	
	}
	
	signOut(): void {
		this.dataService.get('/api/sign_out', true).subscribe(response => {
			if (response.statusCode == 200) {
				this.dataService.removeToken();
				this.authenticatedProfile.next(null);
				this.router.navigate(['/sign_up']);
			}
		});
	}
	
	get(username: string = 'me'): Observable<User | AuthenticatedUser> {
		return this.dataService.get(`/api/users/=/${username}`, true).map((json: JsonResponse) => json.data).share();
	}
	
	likers(username: string = 'me', offset = 0, limit = 25): Observable<User[]> {
		return this.dataService.get(`/api/users/=/${username}/likers?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => json.data).share();
	}
	
	likees(username: string = 'me', offset = 0, limit = 25): Observable<User[]> {
		return this.dataService.get(`/api/users/=/${username}/likees?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => json.data).share();
	}
	
	like(username: string): Observable<User> {
		return this.dataService.post(`/api/users/like/${username}`, null, true).map((json: JsonResponse) => json.data as User).share();
	}
	
	dislike(username: string): Observable<User> {
		return this.dataService.post(`/api/users/dislike/${username}`, null, true).map((json: JsonResponse) => json.data as User).share();
	}
	
	search(query: string, offset = 0, limit = 25): Observable<User[]> {
		return this.dataService.get(`/api/users/search/${query}?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => json.data).share();
	}
	
	updateLocation(location: Location): Observable<AuthenticatedUser> {
		return this.dataService.post(`/api/account/location`, `${JSON.stringify(location)}`, true).map((json: JsonResponse) => json.data).do(user => this.authenticatedProfile.next({
			loggedIn: !!user,
			user: user
		})).share();
	}
	
	updateBoarding(boarded: boolean): Observable<AuthenticatedUser> {
		return this.dataService.post(`/api/account/boarding`, `${JSON.stringify({
			boarded: boarded
		})}`, true).map((json: JsonResponse) => json.data).do(user => this.authenticatedProfile.next({
			loggedIn: !!user,
			user: user
		})).share();
	}
	
	settings(): Observable<UserSettings> {
		return this.dataService.get(`/api/account/settings`, true).map((json: JsonResponse) => json.data).share();
	}
	
	updateSettings(recipe: UserSettingsRecipe): Observable<UserSettings> {
		return this.dataService.post(`/api/account/settings`, `${JSON.stringify({
			settings: recipe
		})}`, true).map((json: JsonResponse) => json.data).share();
	}
	
	suggested(offset = 0, limit = 25): Observable<User[]> {
		return this.dataService.get(`/api/users/suggested?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => json.data).share();
	}
	
	updateAvatar(file: File): Observable<AuthenticatedUser> {
		let promise = file == null ? this.dataService.post(`/api/account/delete-avatar`, null, true) : this.dataService.multipart(`/api/account/avatar`, file, true);
		return promise.map((json: JsonResponse) => json.data).do(user => this.authenticatedProfile.next({
			loggedIn: !!user,
			user: user
		})).share();
	}
	
	update(recipe: UserRecipe): Observable<AuthenticatedUser> {
		return this.dataService.post(`/api/account/update`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as AuthenticatedUser).do(user => this.authenticatedProfile.next({
			loggedIn: !!user,
			user: user
		})).share();
	}
	
	notifications(offset = 0, limit = 25): Observable<Notification[]> {
		return this.dataService.get(`/api/account/notifications?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => json.data).do(() => {
			this.getAuthenticatedUser().user.unreadNotifications = 0;
		}).share();
	}
}
