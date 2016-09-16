import {Injectable} from "@angular/core";
import {DataService} from "./data.service";
import {Router} from "@angular/router";

@Injectable()
export class UserService {
    
    dataService: DataService;
    router : Router;

    constructor(dataService: DataService, router: Router) {
        this.dataService = dataService;
        this.router = router;
    }


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
