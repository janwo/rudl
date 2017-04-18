import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from "@angular/core";
import {Router} from "@angular/router";
import {Locale} from "../../../models/locale";
import {ButtonStyles} from "../control/styled-button.component";
import {ActivityService} from "../../../services/activity.service";
import {ActivityRecipe} from "../../../models/activity";
import {TranslationListComponent} from "../translation/translation-list.component";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import Language = Locale.Language;
import Translations = Locale.Translations;

@Component({
    templateUrl: 'create-activity.component.html',
    styleUrls: ['create-activity.component.scss'],
    selector: 'create-activity'
})
export class CreateActivityComponent implements OnInit {
	
	@Input() defaultName: string;
    @Output() onCanceled: EventEmitter<any> = new EventEmitter();
    @ViewChild(TranslationListComponent) translationList: TranslationListComponent;
	form: FormGroup;
    
    submitPending: boolean;
    cancelButtonStyle: ButtonStyles = ButtonStyles.outlined;
    
    constructor(
        private activityService: ActivityService,
        private router: Router,
        private fb: FormBuilder
    ) {}
    
	ngOnInit(): void {
		this.form = this.fb.group({
			translations: this.fb.array([]),
			icon: [ null, [
				Validators.required
			]]
		});
		
	}
	
	
	cancel() {
        this.onCanceled.emit();
    }
    
    submit() {
	    this.translationList.markAsTouched();
	    this.form.controls.icon.markAsTouched();
	    if(!this.form.valid) return;
	
	    // Mark as pending.
	    this.submitPending = true;
	
		// Create activity recipe.
	    let activityRecipe: ActivityRecipe = {
		    translations: {},
		    icon: this.form.controls.icon.value
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
