import {DataService, JsonResponse} from "./data.service";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {List} from "../models/list";
import {Activity, ActivityRecipe} from "../models/activity";
import {Locale} from "../models/locale";
import {UserService} from "./user.service";
import Translations = Locale.Translations;

@Injectable()
export class UtilService {
    
    constructor(
        private dataService: DataService
    ) {}
	
	icons(): Observable<{ [key: string]: string }> {
		return this.dataService.get(`/api/utils/icons`, true).map((json: JsonResponse) => json.data).share();
	}
}
