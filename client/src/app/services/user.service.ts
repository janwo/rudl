import {DataService, JsonResponse} from "./data.service";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {List} from "../models/List";
import {User} from "../models/User";
import {Activity} from "../models/Activity";

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
