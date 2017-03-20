import {Component, Input, Output, EventEmitter} from "@angular/core";
import {Router} from "@angular/router";
import {Locale} from "../../../models/locale";
import {ButtonStyles} from "../controls/styled-button.component";
import {ActivityService} from "../../../services/activity.service";
import {ActivityRecipe} from "../../../models/activity";
import Language = Locale.Language;
import Translations = Locale.Translations;

@Component({
    templateUrl: 'create-activity.component.html',
    styleUrls: ['create-activity.component.scss'],
    selector: 'create-activity'
})
export class CreateActivityComponent {
    
    @Input() defaultName: string;
    @Output() onCanceled: EventEmitter<any> = new EventEmitter();
    recipe: ActivityRecipe = {
    	translations: {}
    };
    buttonStyle: ButtonStyles = ButtonStyles.uncolored;
    
    constructor(
        private activityService: ActivityService,
        private router: Router
    ) {}
    
    setTranslations(translations: Translations) {
        this.recipe.translations = translations;
    }
    
    cancel() {
        this.onCanceled.emit();
    }
    
    submit() {
        this.activityService.create(this.recipe).subscribe(activity => this.router.navigate(['/activities', activity.id]));
    }
}
