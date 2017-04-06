import {Component, Input, Output, EventEmitter, OnInit, ViewChild} from "@angular/core";
import {Router} from "@angular/router";
import {Locale} from "../../../models/locale";
import {ButtonStyles} from "../control/styled-button.component";
import {ActivityService} from "../../../services/activity.service";
import {ActivityRecipe} from "../../../models/activity";
import Language = Locale.Language;
import Translations = Locale.Translations;
import {TranslationListComponent} from "../translation/translation-list.component";

@Component({
    templateUrl: 'create-activity.component.html',
    styleUrls: ['create-activity.component.scss'],
    selector: 'create-activity'
})
export class CreateActivityComponent {
    
    @Input() defaultName: string;
    @Output() onCanceled: EventEmitter<any> = new EventEmitter();
    @ViewChild(TranslationListComponent) translationList: TranslationListComponent;
    
    submitPending: boolean;
    buttonStyle: ButtonStyles = ButtonStyles.uncolored;
    
    constructor(
        private activityService: ActivityService,
        private router: Router
    ) {}
    
    cancel() {
        this.onCanceled.emit();
    }
    
    submit() {
	    this.translationList.markAsTouched();
	    if(!this.translationList.takenTranslations.valid) return;
	
	    // Mark as pending.
	    this.submitPending = true;
	
		// Create activity recipe.
	    let activityRecipe: ActivityRecipe = {
		    translations: {}
	    };
	    
	    // Fire and remove pending state when done.
	    this.translationList.takenTranslations.value.forEach((translation: {
	        language: string, translation: string
	    }) => activityRecipe.translations[translation.language] = translation.translation);
	    
	    this.activityService.create(activityRecipe).subscribe(activity => {
		    this.submitPending = false;
		    this.router.navigate(['/rudel', activity.id])
	    }, error => {
		    this.submitPending = false;
		    alert(error.message);
	    });
    }
}
