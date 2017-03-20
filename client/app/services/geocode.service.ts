import {Injectable} from "@angular/core";
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs/Observable";

@Injectable()
export class GeocodeService {
	
	private static apiKey: string = process.env.API_KEYS.mapzen;
	private static url = 'https://search.mapzen.com/v1/search?';
	
	constructor(
		private http: Http
	) {}
	
	private static handleResponse(response: Response): GeocodeLocation[] {
		return response.json().features.map((feature: any) => {
			return {
				label: feature.properties.label,
				location: feature.geometry.coordinates.reverse()
			};
		});
	}
	
	private static buildQuery(text: string, location: number[] | false = false, size: number | false = false): string {
		let query = `api_key=${GeocodeService.apiKey}&text=${text}`;
		if(location) query += `&focus.point.lat=${location[0]}&focus.point.lon=${location[1]}`;
		if(size) query += `&size=${size}`;
		return query;
	}
	
	private get(url: string): Observable<GeocodeLocation[]> {
		return this.http.get(url).map(GeocodeService.handleResponse);
	}
	
	search(text: string, location: number[] | false = false) : Observable<GeocodeLocation[]> {
		return this.get(GeocodeService.url + GeocodeService.buildQuery(text, location, 5));
	}
}

export interface GeocodeLocation {
	label: string;
	location: number[]
}
