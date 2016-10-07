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
    
    getUser(username: string): Observable<JsonResponse> {
        return this.dataService.get(`/api/users/${username}`, true);
    }
    
    follower(username?: string): Observable<JsonResponse> {
        return this.dataService.get(username ? `/api/users/${username}/followers` : '/api/me/followers', true);
    }
    
    followees(username?: string): Observable<JsonResponse> {
        return this.dataService.get(username ? `/api/users/${username}/following` : '/api/me/following', true);
    }
    
    addFollowee(username: string): Observable<JsonResponse> {
        return this.dataService.put(`/api/me/following/${username}`, null, true);
    }
    
    deleteFollowee(username: string): Observable<JsonResponse> {
        return this.dataService.delete(`/api/me/following/${username}`, true);
    }
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    location: string;
    meta: any;
    createdAt: number;
    updatedAt: number;
    relation: UserRelation;
    links: UserLinks;
}

export interface UserLinks {
    
}

export interface UserRelation {
    followee: boolean;
    follower: boolean;
    mutual_followers: number;
    mutual_followees: number;
}
