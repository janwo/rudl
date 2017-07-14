import {Injectable} from '@angular/core';
import {Headers, Http, RequestOptionsArgs, Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs';

@Injectable()
export class DataService {
	
	static domain: string = process.env.DOMAIN;
	static callbackMessageType: string = process.env.MESSAGE_TYPES.oauth;
	static localStorageKey: string = 'jwt-token';
	private token: BehaviorSubject<string>;
	
	constructor(private http: Http) {
		// Create token observable.
		this.token = new BehaviorSubject<string>(window.localStorage.getItem(DataService.localStorageKey) || null);
		this.token.subscribe((tokenString: string) => {
			if (tokenString) {
				// Save item, if set.
				window.localStorage.setItem(DataService.localStorageKey, tokenString);
				return;
			}
			
			// Otherwise remove item.
			window.localStorage.removeItem(DataService.localStorageKey);
		});
		
		// Listen to any incoming authentication messages.
		this.registerAuthenticationMessageListener();
	}
	
	private registerAuthenticationMessageListener() {
		window.addEventListener('message', event => {
			if (event.origin != DataService.domain || event.data.type !== DataService.callbackMessageType) return;
			this.token.next(event.data.message);
		}, false);
	}
	
	setToken(tokenString: string): void {
		this.token.next(tokenString);
	}
	
	removeToken(): void {
		this.token.next(null);
	}
	
	getToken(): string {
		return this.token.getValue();
	}
	
	getTokenObservable() {
		return this.token.asObservable();
	}
	
	get(url: string, useAuthentication: boolean = false): Observable<JsonResponse> {
		let requestOptions: RequestOptionsArgs = {};
		if (useAuthentication) {
			if (!this.getToken()) Observable.throw('Cannot use authentication without having a token set.');
			requestOptions.headers = this.createAuthorizationHeader(this.getToken());
		}
		return this.http.get(DataService.domain + url, requestOptions).map(this.preHandler).catch(err => this.errorHandler(err));
	}
	
	post(url: string, body: string, useAuthentication: boolean = false): Observable<JsonResponse> {
		let requestOptions: RequestOptionsArgs = {
			headers: new Headers()
		};
		
		if (useAuthentication) {
			if (!this.getToken()) Observable.throw('Cannot use authentication without having a token set.');
			requestOptions.headers = this.createAuthorizationHeader(this.getToken());
		}
		
		requestOptions.headers.append('Content-Type', 'application/json');
		return this.http.post(DataService.domain + url, body, requestOptions).map(this.preHandler).catch(err => this.errorHandler(err));
	}
	
	put(url: string, body: string, useAuthentication: boolean = false): Observable<JsonResponse> {
		let requestOptions: RequestOptionsArgs = {};
		if (useAuthentication) {
			if (!this.getToken()) Observable.throw('Cannot use authentication without having a token set.');
			requestOptions.headers = this.createAuthorizationHeader(this.getToken());
		}
		return this.http.put(DataService.domain + url, body, requestOptions).map(this.preHandler).catch(err => this.errorHandler(err));
	}
	
	delete(url: string, useAuthentication: boolean = false): Observable<JsonResponse> {
		let requestOptions: RequestOptionsArgs = {};
		if (useAuthentication) {
			if (!this.getToken()) Observable.throw('Cannot use authentication without having a token set.');
			requestOptions.headers = this.createAuthorizationHeader(this.getToken());
		}
		return this.http.delete(DataService.domain + url, requestOptions).map(this.preHandler).catch(err => this.errorHandler(err));
	}
	
	multipart(url: string, file: File, useAuthentication: boolean = false ): Observable<JsonResponse> {
		let requestOptions: RequestOptionsArgs = {};
		
		if (useAuthentication) {
			if (!this.getToken()) Observable.throw('Cannot use authentication without having a token set.');
			requestOptions.headers = this.createAuthorizationHeader(this.getToken());
		}
		
		let body = new FormData();
		body.append('file', file, file.name);
		return this.http.post(url, body, requestOptions).map(this.preHandler).catch(err => this.errorHandler(err));
	}
	
	private createAuthorizationHeader(token: string): Headers {
		let headers: Headers = new Headers();
		headers.append('Authorization', `Bearer ${token}`);
		return headers;
	}
	
	private preHandler(response: Response): any {
		return response.json();
	}
	
	private errorHandler(errResponse: any): Observable<any> {
		if (errResponse.status === 401) this.removeToken();
		return Observable.throw(errResponse.json());
	}
}

export interface JsonResponse {
	data?: any;
	statusCode: number;
}
