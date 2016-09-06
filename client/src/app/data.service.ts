import {Injectable} from "@angular/core";
import {Headers, Jsonp, Response} from "@angular/http";
import {Observable} from "rxjs";

@Injectable()
export class DataService {

    public static domain: string = 'http://localhost:8079';

    private jsonp: Jsonp;

    constructor(jsonp: Jsonp) {
        this.jsonp = jsonp;
    }

    public get(url: string, headers: Headers = new Headers()): Observable<Response> {
        return this.jsonp.get(DataService.domain + url, {
            headers: headers
        });
    }

    public post(url: string, headers: Headers = new Headers(), body): Observable<Response> {
        return this.jsonp.post(DataService.domain + url, body, {
            headers: headers
        });
    }

    public delete(url: string, headers: Headers = new Headers()): Observable<Response> {
        return this.jsonp.delete(DataService.domain + url, {
            headers: headers
        });
    }
}
