import {Injectable} from "@angular/core";
import {Headers, Http, Response} from "@angular/http";
import {Observable} from "rxjs/Observable";

@Injectable()
export class DataService {

    public static domain: string = 'http://localhost:8079';

    private http: Http;

    constructor(http: Http) {
        this.http = http;
    }

    public get(url: string, headers : Headers = new Headers()): Observable<any> {
        return this.http.get(DataService.domain + url, {
            headers: headers
        }).map(response => response.json());
    }

    public post(url: string, headers: Headers = new Headers(), body: string): Observable<any> {
        return this.http.post(DataService.domain + url, body, {
            headers: headers
        }).map(response => response.json());
    }

    public delete(url: string, headers: Headers = new Headers()): Observable<any> {
        return this.http.delete(DataService.domain + url, {
            headers: headers
        }).map(response => response.json());
    }
}
