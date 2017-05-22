import {DataService, JsonResponse} from "./data.service";
import {Injectable} from "@angular/core";
import {Locale} from "../models/locale";
import {UserService} from "./user.service";
import {Expedition} from "../models/expedition";
import Translations = Locale.Translations;
import {CommentRecipe, Comment} from '../models/comment';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class CommentService {
    
    constructor(
        private dataService: DataService
    ) {}
	
	update(key: string, recipe: CommentRecipe): Observable<Comment> {
		return this.dataService.post(`/api/comments/=/${key}/update`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as Comment).share();
	}
	
	remove(key: string): Observable<boolean> {
		return this.dataService.delete(`/api/comments/=/${key}`, true).map((json: JsonResponse) => {
			return json.statusCode == 200;
		}).share();
	}
	
    createForExpedition(expedition: string, recipe: CommentRecipe): Observable<Comment> {
        return this.dataService.post(`/api/expeditions/=/${expedition}/create-comment`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as Comment);
    }
    
    getForExpedition(expedition: string, offset: number = 0): Observable<Comment[]> {
        return this.dataService.get(`/api/expeditions/=/${expedition}/comments/${offset}`, true).map((json: JsonResponse) => {
		    return json.data as Comment[];
	    }).share();
    }
}
