import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Location} from '../models/location';

@Injectable()
export class GeocodeService {
	
	private static apiKey: string = process.env.API_KEYS.mapzen;
	private static url = 'https://search.mapzen.com/v1/search?';
	
	constructor(private http: Http) {}
	
	private static handleResponse(response: Response): GeocodeLocation[] {
		return response.json().features.map((feature: any) => {
			return {
				label: feature.properties.label,
				location: {
					lng: feature.geometry.coordinates[0],
					lat: feature.geometry.coordinates[1]
				}
			};
		});
	}
	
	private static buildQuery(text: string, location: Location | false = false, size: number | false = false): string {
		let query = `api_key=${GeocodeService.apiKey}&text=${text}`;
		if (location) query += `&focus.point.lat=${location.lat}&focus.point.lon=${location.lng}`;
		if (size) query += `&size=${size}`;
		return query;
	}
	
	private get(url: string): Observable<GeocodeLocation[]> {
		return this.http.get(url).map(response => GeocodeService.handleResponse(response));
	}
	
	search(text: string, location: Location | false = false, limit = 5): Observable<GeocodeLocation[]> {
		return this.get(GeocodeService.url + GeocodeService.buildQuery(text, location, limit));
	}
}

export interface GeocodeLocation {
	label: string;
	location: Location
}
