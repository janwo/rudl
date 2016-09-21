import {DataService} from "./data.service";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";

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
        this.dataService.get('/api/sign-out', true).subscribe(response => {
            if(response.statusCode == 200) {
                this.dataService.removeToken();
                this.router.navigate(['/sign-up']);
            }
        });
    }

    me() {
        return this.dataService.get('/api/users/me', true);
    }
}
