import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {Headers, Http, RequestOptionsArgs, Response} from "@angular/http";
import {Observable} from "rxjs/Observable";

@Injectable()
export class DataService {

    public static domain: string = 'http://localhost:8079';
    static callbackMessageType: string = 'AUTH_CALLBACK_MESSAGE';
    static localStorageKey: string = 'jwt-token';
    
    router: Router;
    token: string = null;

    private http: Http;

    constructor(http: Http, router: Router) {
        this.http = http;
        this.router = router;
        this.token = localStorage.getItem(DataService.localStorageKey) || null;
        
        // Listen to any incoming authentication messages.
        this.registerAuthenticationMessageListener();
    }
    
    setToken(token: string): void {
        this.token = token;
        localStorage.setItem(DataService.localStorageKey, token);
    }

    getToken(): string {
        return this.token;
    }

    removeToken(): void {
        this.token = null;
        localStorage.removeItem(DataService.localStorageKey);
    }

    public get(url: string, useAuthentication: boolean = false): Observable<any> {
        let requestOptions : RequestOptionsArgs = {};
        if(useAuthentication) {
            if(!this.getToken()) Observable.throw('Cannot use authentication without having a token set.');
            requestOptions.headers = this.createAuthorizationHeader(this.token);
        }
        return this.http.get(DataService.domain + url, requestOptions).map(this.preHandler).catch(err => this.errorHandler(err));
    }

    public post(url: string, body: string, useAuthentication: boolean = false): Observable<any> {
        let requestOptions : RequestOptionsArgs = {};
        if(useAuthentication) {
            if(!this.getToken()) Observable.throw('Cannot use authentication without having a token set.');
            requestOptions.headers = this.createAuthorizationHeader(this.token);
        }
        return this.http.post(DataService.domain + url, body, requestOptions).map(this.preHandler).catch(err => this.errorHandler(err));
    }

    public delete(url: string, useAuthentication: boolean = false): Observable<any> {
        let requestOptions : RequestOptionsArgs = {};
        if(useAuthentication) {
            if(!this.getToken()) Observable.throw('Cannot use authentication without having a token set.');
            requestOptions.headers = this.createAuthorizationHeader(this.token);
        }
        return this.http.delete(DataService.domain + url, requestOptions).map(this.preHandler).catch(err => this.errorHandler(err));
    }
    
    private createAuthorizationHeader(token: string): Headers {
        let headers: Headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);
        return headers;
    }
    
    private preHandler(response: Response): any {
        return response.json();
    }
    
    private errorHandler(err: any) {
        if(err.status === 401) {
            this.removeToken();
            this.router.navigate(['/sign-up']);
        } else
            return Observable.throw(err);
    }
    
    private registerAuthenticationMessageListener() {
        window.addEventListener('message', event => {
            if (event.origin != DataService.domain || event.data.type !== DataService.callbackMessageType) return;
            this.setToken(event.data.message.token);
            
            this.router.navigate(['/']);
        }, false);
    }
}
