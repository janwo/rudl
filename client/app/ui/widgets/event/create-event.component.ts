import {Component, Output, EventEmitter} from "@angular/core";
import {Router} from "@angular/router";
import {Locale} from "../../../models/locale";
import {ButtonStyles} from "../controls/styled-button.component";
import {EventRecipe} from "../../../models/event";
import {EventService} from "../../../services/event.service";
import Language = Locale.Language;
import Translations = Locale.Translations;
import {UserService} from "../../../services/user.service";

@Component({
    templateUrl: 'create-event.component.html',
    styleUrls: ['create-event.component.scss'],
    selector: 'create-event'
})
export class CreateEventComponent {
    
    @Output() onCanceled: EventEmitter<any> = new EventEmitter();
    buttonStyle: ButtonStyles = ButtonStyles.uncolored;
    recipe: EventRecipe = {
	    title: null,
	    description: null,
	    needsApproval: false,
	    slots: 1,
	    date: '',
	    fuzzyTime: false,
	    location: []
    };
    
    constructor(
        private eventService: EventService,
        private userService: UserService,
        private router: Router
    ) {}
    
    cancel() {
        this.onCanceled.emit();
    }
    
    submit() {
        this.eventService.create(this.recipe).subscribe(event => this.router.navigate(['/events', event.id]));
    }
}
