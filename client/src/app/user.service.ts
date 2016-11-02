import {DataService, JsonResponse} from "./data.service";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";

@Injectable()
export class UserService {

    constructor(
        private dataService: DataService,
        private router: Router
    ) {}


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
    
    getUser(username: string): Observable<User> {
        return this.dataService.get(`/api/users/${username}`, true).map((json: JsonResponse) => json.data).share();
    }
    
    followers(username?: string): Observable<User[]> {
        return this.dataService.get(username ? `/api/users/${username}/followers` : '/api/me/followers', true).map((json: JsonResponse) => json.data).share();
    }
    
    followees(username?: string): Observable<User[]> {
        return this.dataService.get(username ? `/api/users/${username}/following` : '/api/me/following', true).map((json: JsonResponse) => json.data).share();
    }
    
    lists(username?: string): Observable<List[]> {
        return this.dataService.get(username ? `/api/users/${username}/lists` : '/api/me/lists', true).map((json: JsonResponse) => json.data).share();
    }
    
    activities(username?: string): Observable<Activity[]> {
        return this.dataService.get(username ? `/api/users/${username}/activities` : '/api/me/activities', true).map((json: JsonResponse) => json.data).share();
    }
    
    addFollowee(username: string): Observable<void> {
        return this.dataService.put(`/api/me/following/${username}`, null, true).map(() => {}).share();
    }
    
    deleteFollowee(username: string): Observable<void> {
        return this.dataService.delete(`/api/me/following/${username}`, true).map(() => {}).share();
    }
    
    suggestPeople(): Observable<User[]> {
        return this.dataService.get(`/api/me/suggestions/people`, true).map((json: JsonResponse) => json.data).share();
    }
}

export interface Document {
    id: string;
    createdAt: number;
    updatedAt: number;
}

export interface User extends Document {
    firstName: string;
    lastName: string;
    username: string;
    location: string;
    meta: UserMeta;
    relations: UserRelations;
    statistics: UserStatistics;
    links: UserLinks;
}

export interface UserLinks {
    avatars?: {
        small: string;
        medium: string;
        large: string;
    };
}

export interface UserMeta {
    hasAvatar: boolean;
    profileText: string;
}

export interface UserRelations {
    followee: boolean;
    follower: boolean;
    mutual_followers: number;
    mutual_followees: number;
}

export interface UserStatistics {
    followers: number;
    followees: number;
    lists: number;
    activities: number;
}

export interface Translations {
    de?: string;
    en?: string;
    es?: string;
    fr?: string;
}

export interface List extends Document{
    name: Translations
}

export interface Activity extends Document{
    name: Translations
}
