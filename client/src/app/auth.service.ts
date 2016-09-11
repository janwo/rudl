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

    private redirectToDashboard() {
        this.router.navigateByUrl('home');
    }

    signUp(username: string, password: string) {

    }

    signIn(username: string, password: string) {

    }

    private registerAuthenticationMessageListener() {
        window.addEventListener('message', event => {
            if (event.origin != DataService.domain || event.data.type !== AuthService.callbackMessageType) return;
            this.setToken(event.data.message.token);

            console.group('Window message received');
            console.log(event.data.message.token);
            console.groupEnd();

            this.redirectToDashboard();
        }, false);
    }

    me() {
        return this.dataService.get('/api/users/me', this.createAuthorizationHeader());
    }
}