import {DataService, JsonResponse} from './data.service';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {List, ListRecipe} from '../models/list';
import {Rudel} from '../models/rudel';
import {Locale} from '../models/locale';
import {UserService} from './user.service';
import {User} from '../models/user';
import Translations = Locale.Translations;

@Injectable()
export class ListService {
	
	constructor(private userService: UserService,
	            private dataService: DataService) {}
	
	get(key: string): Observable<List> {
		return this.dataService.get(`/api/lists/=/${key}`, true).map((json: JsonResponse) => json.data as List).map((list: List) => {
			list.name = Locale.getBestTranslation(list.translations, this.userService.getAuthenticatedUser().user.languages);
			return list;
		}).share();
	}
	
	addRudel(rudel: string, list: string): Observable<void> {
		return this.dataService.post(`/api/lists/add-rudel`, `${JSON.stringify({
			rudel: rudel,
			list: list
		})}`, true).map((json: JsonResponse) => {});
	}
	
	deleteRudel(rudel: string, list: string): Observable<void> {
		return this.dataService.post(`/api/lists/delete-rudel`, `${JSON.stringify({
			rudel: rudel,
			list: list
		})}`, true).map((json: JsonResponse) => {});
	}
	
	create(recipe: ListRecipe): Observable<List> {
		return this.dataService.post(`/api/lists/create`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as List);
	}
	
	update(recipe: ListRecipe): Observable<List> {
		//TODO Partielles updaten implementieren
		return this.dataService.post(`/api/lists/update`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as List);
	}
	
	like(list: string): Observable<List> {
		return this.dataService.post(`/api/lists/like/${list}`, null, true).map((json: JsonResponse) => json.data as List).map((list: List) => {
			list.name = Locale.getBestTranslation(list.translations, this.userService.getAuthenticatedUser().user.languages);
			return list;
		}).share();
	}
	
	dislike(list: string): Observable<List> {
		return this.dataService.post(`/api/lists/dislike/${list}`, null, true).map((json: JsonResponse) => json.data as List).map((list: List) => {
			if (list) list.name = Locale.getBestTranslation(list.translations, this.userService.getAuthenticatedUser().user.languages);
			return list;
		}).share();
	}
	
	likers(list: string, offset = 0, limit = 25): Observable<User[]> {
		return this.dataService.get(`/api/lists/=/${list}/likers?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => json.data as User[]).share();
	}
	
	rudel(list: string, offset = 0, limit = 25): Observable<Rudel[]> {
		return this.dataService.get(`/api/lists/=/${list}/rudel?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => {
			return json.data.map((rudel: Rudel) => {
				rudel.name = Locale.getBestTranslation(rudel.translations, this.userService.getAuthenticatedUser().user.languages);
				return rudel;
			});
		}).share();
	}
	
	search(query: string, offset = 0, limit = 25): Observable<List[]> {
		return this.dataService.get(`/api/lists/search/${query}?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => {
			return json.data.map((list: List) => {
				list.name = Locale.getBestTranslation(list.translations, this.userService.getAuthenticatedUser().user.languages);
				return list;
			});
		}).share();
	}
	
	by(username: string = null, offset = 0, limit = 25): Observable<List[]> {
		username = username ? username : this.userService.getAuthenticatedUser().user.username;
		return this.dataService.get(`/api/lists/by/${username}?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => {
			return json.data.map((list: List) => {
				list.name = Locale.getBestTranslation(list.translations, this.userService.getAuthenticatedUser().user.languages);
				return list;
			});
		}).share();
	}
}
