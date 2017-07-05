import {DataService, JsonResponse} from './data.service';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {List} from '../models/list';
import {Rudel, RudelRecipe} from '../models/rudel';
import {Locale} from '../models/locale';
import {UserService} from './user.service';
import {User} from '../models/user';
import {Location} from '../models/location';
import Translations = Locale.Translations;

@Injectable()
export class RudelService {
	
	constructor(private userService: UserService,
	            private dataService: DataService) {}
	
	create(recipe: RudelRecipe): Observable<Rudel> {
		return this.dataService.post(`/api/rudel/create`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as Rudel);
	}
	
	update(key: string, recipe: RudelRecipe): Observable<Rudel> {
		//TODO Partielles updaten implementieren
		return this.dataService.post(`/api/rudel/=/${key}/update`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as Rudel);
	}
	
	get(key: string): Observable<Rudel> {
		return this.dataService.get(`/api/rudel/=/${key}`, true).map((json: JsonResponse) => json.data as Rudel).map((rudel: Rudel) => {
			rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
			return rudel;
		}).share();
	}
	
	likers(rudel: string, offset = 0, limit = 25): Observable<User[]> {
		return this.dataService.get(`/api/rudel/=/${rudel}/likers?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => json.data as User[]).share();
	}
	
	like(rudel: string): Observable<Rudel> {
		return this.dataService.post(`/api/rudel/like/${rudel}`, null, true).map((json: JsonResponse) => json.data as Rudel).map((rudel: Rudel) => {
			rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
			return rudel;
		}).share();
	}
	
	dislike(rudel: string): Observable<Rudel> {
		return this.dataService.post(`/api/rudel/dislike/${rudel}`, null, true).map((json: JsonResponse) => json.data as Rudel).map((rudel: Rudel) => {
			if (rudel) rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
			return rudel;
		}).share();
	}

	search(query: string, offset = 0, limit = 25): Observable<Rudel[]> {
		return this.dataService.get(`/api/rudel/search/${query}?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => {
			return json.data.map((rudel: Rudel) => {
				rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
				return rudel;
			});
		}).share();
	}

	locations(rudel: string): Observable<Location[]> {
		return this.dataService.get(`/api/rudel/=/${rudel}/locations`, true).map((json: JsonResponse) => json.data as Location[]).share();
	}
	
	lists(rudel: string, offset = 0, limit = 25): Observable<List[]> {
		return this.dataService.get(`/api/rudel/=/${rudel}/lists?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => {
			return json.data.map((list: List) => {
				list.name = Locale.getBestTranslation(list.translations, this.userService.getAuthenticatedUser().user.languages);
				return list;
			});
		}).share();
	}
	
	by(username: string = 'me', offset = 0, limit = 25): Observable<Rudel[]> {
		return this.dataService.get(`/api/rudel/by/${username}?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => {
			return json.data.map((rudel: Rudel) => {
				rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
				return rudel;
			});
		}).share();
	}
	
	suggested(offset = 0, limit = 25): Observable<Rudel[]> {
		return this.dataService.get(`/api/rudel/suggested?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => {
			return json.data.filter((rudel: Rudel) => {
				rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
				return rudel;
			});
		}).share();
	}
	
	recent(offset = 0, limit = 25): Observable<Rudel[]> {
		return this.dataService.get(`/api/rudel/recent?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => {
			return json.data.filter((rudel: Rudel) => {
				rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
				return rudel;
			});
		}).share();
	}
	
	popular(offset = 0, limit = 25): Observable<Rudel[]> {
		return this.dataService.get(`/api/rudel/popular?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => {
			return json.data.filter((rudel: Rudel) => {
				rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
				return rudel;
			});
		}).share();
	}
}
