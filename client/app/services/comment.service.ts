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
    
    private getCommentType(type: CommentType): string {
    	switch(type) {
		    case CommentType.expedition:
		    	return 'expedition';
		    
		    default:
		    	return null;
	    }
    }
	
    create(type: CommentType, key: string, recipe: CommentRecipe): Observable<Comment> {
        return this.dataService.post(`/api/comments/create`, JSON.stringify({
	        target: {
	        	type: this.getCommentType(type),
		        id: key
	        },
	        recipe: recipe
        }), true).map((json: JsonResponse) => json.data as Comment);
    }
    
    update(key: string, recipe: CommentRecipe): Observable<Comment> {
        return this.dataService.post(`/api/comments/=/${key}/update`, JSON.stringify(recipe), true).map((json: JsonResponse) => json.data as Comment).share();
    }
    
    remove(key: string): Observable<boolean> {
        return this.dataService.delete(`/api/comments/=/${key}`, true).map((json: JsonResponse) => {
            return json.statusCode == 200;
        }).share();
    }
    
    get(type: CommentType, key: string, offset: number = 0, limit: number = 20): Observable<Comment[]> {
        return this.dataService.get(`/api/comments/of/${type}/${key}/${offset}/${limit}`).map((json: JsonResponse) => {
		    return json.data as Comment[];
	    }).share();
    }
}

export enum CommentType {
	expedition
}
