import {Injectable} from "@angular/core";
import {Headers} from "@angular/http";
import {Router} from "@angular/router";
import {DataService} from "./data.service";

@Injectable()
export class AuthService {

    static callbackMessageType: string = 'AUTH_CALLBACK_MESSAGE';
    static localStorageKey: string = 'jwt-token';

	dataService: DataService;
    router: Router;
    token: string | boolean = false;

    constructor(dataService: DataService, router: Router) {
        this.dataService = dataService;
        this.router = router;
        this.token = localStorage.getItem(AuthService.localStorageKey) || false;

        // Listen to any incoming authentication messages.
        this.registerAuthenticationMessageListener();
    }

    private createAuthorizationHeader(): Headers {
        let headers: Headers = new Headers();
        headers.append('Authorization', `Bearer ${this.getToken()}`);
        return headers;
    }

    setToken(token: string): void {
        this.token = token;
        localStorage.setItem(AuthService.localStorageKey, token);
    }

    getToken(): string | boolean {
        return this.token;
    }

    removeToken(): void {
        this.token = false;
        localStorage.removeItem(AuthService.localStorageKey);
    }

    signUp(username: string, password: string) {

    }
    
    signIn(username: string, password: string) {
        
    }
    
    signOut() {
        this.dataService.get('/api/sign-out', this.createAuthorizationHeader()).subscribe(response => {
            if(response.statusCode == 200) {
                this.removeToken();
                this.router.navigate(['/sign-up']);
            }
        });
    }

    private registerAuthenticationMessageListener() {
        window.addEventListener('message', event => {
            if (event.origin != DataService.domain || event.data.type !== AuthService.callbackMessageType) return;
            this.setToken(event.data.message.token);
    
            this.router.navigate(['/']);
        }, false);
    }

    me() {
        return this.dataService.get('/api/users/me', this.createAuthorizationHeader());
    }
}
