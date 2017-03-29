import {Component, Output, EventEmitter, OnInit, Input} from "@angular/core";
import {Router} from "@angular/router";
import {Locale} from "../../../models/locale";
import {ButtonStyles} from "../controls/styled-button.component";
import {EventRecipe} from "../../../models/event";
import {EventService} from "../../../services/event.service";
import {UserService} from "../../../services/user.service";
import Language = Locale.Language;
import Translations = Locale.Translations;
import {Activity} from "../../../models/activity";

@Component({
    templateUrl: 'create-event.component.html',
    styleUrls: ['create-event.component.scss'],
    selector: 'create-event'
})
export class CreateEventComponent {
	
	@Output() onCanceled: EventEmitter<any> = new EventEmitter();
    buttonStyle: ButtonStyles = ButtonStyles.uncolored;
    recipe: EventRecipe = {
	    activity: null,
	    title: null,
	    description: null,
	    date: null,
		location: [0, 0],
	    needsApproval: false,
	    fuzzyTime: false
    };
	
	@Input() set activity(activity: Activity) {
		if(activity) this.recipe.activity = activity.id;
	}
	
	@Input() set location(location: number[]) {
		if(location) this.recipe.location = location;
	}
	
    constructor(
        private eventService: EventService,
        private router: Router
    ) {}
	
	submit() {
		this.eventService.create(this.recipe).subscribe(event => this.router.navigate(['/events', event.id]));
	}
    
    cancel() {
        this.onCanceled.emit();
    }
    
    assign(assignedObject: any) {
		Object.assign(this.recipe, assignedObject);
    }
}
