import {DataService, JsonResponse} from './data.service';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Locale} from '../models/locale';
import {UserService} from './user.service';
import {Expedition, ExpeditionRecipe, ExpeditionRequestResponse} from '../models/expedition';
import {Rudel} from '../models/rudel';
import Translations = Locale.Translations;

@Injectable()
export class ExpeditionService {
	
	constructor(private dataService: DataService,
	            private userService: UserService) {}
	
	create(recipe: ExpeditionRecipe, rudel: Rudel): Observable<Expedition> {
		return this.dataService.post(`/api/expeditions/create`, JSON.stringify({
			rudel: rudel.id,
			expedition: recipe
		}), true).map((json: JsonResponse) => json.data as Expedition);
	}
	
	get(key: string): Observable<Expedition> {
		return this.dataService.get(`/api/expeditions/=/${key}`, true).map((json: JsonResponse) => this.handleExpeditionResponse(json.data)).share();
	}
	
	approve(expedition: string, username: string = 'me'): Observable<ExpeditionRequestResponse> {
		return this.dataService.post(`/api/expeditions/=/${expedition}/approve/${username}`, null, true).map((json: JsonResponse) => {
			if(json.data) json.data.expedition = this.handleExpeditionResponse(json.data.expedition);
			return json.data;
		}).share();
	}
	
	reject(expedition: string, username: string = 'me'): Observable<ExpeditionRequestResponse> {
		return this.dataService.post(`/api/expeditions/=/${expedition}/reject/${username}`, null, true).map((json: JsonResponse) => {
			if(json.data) json.data.expedition = this.handleExpeditionResponse(json.data.expedition);
			return json.data;
		}).share();
	}
	
	attendees(expedition: string, offset = 0, limit = 25): Observable<ExpeditionRequestResponse[]> {
		return this.dataService.get(`/api/expeditions/=/${expedition}/attendees?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => json.data as ExpeditionRequestResponse[]).share();
	}
	
	inviteLike(expedition: string, query: string, offset = 0, limit = 25): Observable<ExpeditionRequestResponse[]> {
		return this.dataService.get(`/api/expeditions/=/${expedition}/invite-like/${query}?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => json.data as ExpeditionRequestResponse[]).share();
	}
	
	nearby(rudel: string | boolean = false, offset = 0, limit = 25): Observable<Expedition[]> {
		return this.dataService.get(rudel === false ? `/api/expeditions/nearby?offset=${offset}&limit=${limit}` : `/api/expeditions/near/${rudel}?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => this.handleExpeditionResponse(json.data)).share();
	}
	
	upcoming(offset = 0, limit = 25): Observable<Expedition[]> {
		return this.dataService.get(`/api/expeditions/upcoming?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => this.handleExpeditionResponse(json.data)).share();
	}
	
	done(offset = 0, limit = 25): Observable<Expedition[]> {
		return this.dataService.get(`/api/expeditions/done?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => this.handleExpeditionResponse(json.data)).share();
	}
	
	upcomingByRudel(rudel: string, offset = 0, limit = 25): Observable<Expedition[]> {
		return this.dataService.get(`/api/expeditions/upcoming/${rudel}?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => this.handleExpeditionResponse(json.data)).share();
	}
	
	doneByRudel(rudel: string, offset = 0, limit = 25): Observable<Expedition[]> {
		return this.dataService.get(`/api/expeditions/done/${rudel}?offset=${offset}&limit=${limit}`, true).map((json: JsonResponse) => this.handleExpeditionResponse(json.data)).share();
	}
	
	private handleExpeditionResponse(data: any | any[]): Expedition | Expedition[] {
		let handleExpedition = (expedition: Expedition) => {
			if (expedition) expedition.rudel.name = Locale.getBestTranslation(expedition.rudel.translations, this.userService.getAuthenticatedUser().user.languages);
			return expedition;
		};
		return data instanceof Array ? data.map(item => handleExpedition(item)) : handleExpedition(data);
	}
}
