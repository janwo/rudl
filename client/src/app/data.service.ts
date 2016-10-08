import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {Headers, Http, RequestOptionsArgs, Response} from "@angular/http";
import {Observable} from "rxjs/Observable";

@Injectable()
export class DataService {

    public static domain: string = 'http://localhost:8079';
    static callbackMessageType: string = 'AUTH_CALLBACK_MESSAGE';
    static localStorageKey: string = 'jwt-token';
    
    token: string = null;

    constructor(
        private http: Http,
        private router: Router
    ) {
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

    public get(url: string, useAuthentication: boolean = false): Observable<JsonResponse> {
        let requestOptions : RequestOptionsArgs = {};
        if(useAuthentication) {
            if(!this.getToken()) Observable.throw('Cannot use authentication without having a token set.');
            requestOptions.headers = this.createAuthorizationHeader(this.token);
        }
        return this.http.get(DataService.domain + url, requestOptions).map(this.preHandler).catch(err => this.errorHandler(err));
    }
    
    public post(url: string, body: string, useAuthentication: boolean = false): Observable<JsonResponse> {
        let requestOptions : RequestOptionsArgs = {};
        if(useAuthentication) {
            if(!this.getToken()) Observable.throw('Cannot use authentication without having a token set.');
            requestOptions.headers = this.createAuthorizationHeader(this.token);
        }
        return this.http.post(DataService.domain + url, body, requestOptions).map(this.preHandler).catch(err => this.errorHandler(err));
    }
    
    public put(url: string, body: string, useAuthentication: boolean = false): Observable<JsonResponse> {
        let requestOptions : RequestOptionsArgs = {};
        if(useAuthentication) {
            if(!this.getToken()) Observable.throw('Cannot use authentication without having a token set.');
            requestOptions.headers = this.createAuthorizationHeader(this.token);
        }
        return this.http.put(DataService.domain + url, body, requestOptions).map(this.preHandler).catch(err => this.errorHandler(err));
    }

    public delete(url: string, useAuthentication: boolean = false): Observable<JsonResponse> {
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
            this.router.navigate(['/sign_up']);
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

export interface JsonResponse {
    data?: any;
    statusCode: number;
}
