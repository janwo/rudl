import {Component, OnInit, Input, Output, EventEmitter} from "@angular/core";
import {trigger, transition, style, animate} from "@angular/animations";
import {UserService} from "../../../services/user.service";
import {Locale} from "../../../models/locale";
import {ButtonStyles} from "../control/styled-button.component";
import Language = Locale.Language;
import languages = Locale.languages;
import Translations = Locale.Translations;
import {FormArray, FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
    templateUrl: 'translation-list.component.html',
    styleUrls: ['translation-list.component.scss'],
    selector: 'translation-list',
    animations: [
        trigger('row', [
            transition(':enter', [
                style({
                    opacity: 0,
                    height: 0
                }),
                animate('150ms', style({
                    opacity: 1,
                    height: '*'
                }))
            ]),
            transition(':leave', [
                style({
                    opacity: 1,
                    height: '*'
                }),
                animate('150ms', style({
                    opacity: 0,
                    height: 0
                }))
            ])
        ])
    ]
})
export class TranslationListComponent implements OnInit {
	
	@Input() defaultText: string = null;
	@Output() form: FormGroup;
	
	takenTranslations: FormArray;
	availableTranslations: FormArray;
    buttonStyle: ButtonStyles = ButtonStyles.uncolored;
    languagePool: string[];
    languageNames = Locale.languageNames;
    
    constructor(
        private userService: UserService,
        private fb: FormBuilder
    ) {}
    
    markAsTouched(): void {
	    this.takenTranslations.controls.forEach((control: FormGroup) => control.controls.translation.markAsTouched());
    }
    
    ngOnInit(){
    	// Get sorted language pool.
	    let userLanguages = this.userService.getAuthenticatedUser().user.languages;
	    this.languagePool = Locale.languages.slice().sort(a => {
		    // Put it to the front.
		    if(userLanguages.indexOf(a) >= 0) return -1;
		
		    // Put it to the back.
		    return 1;
	    });
	    
	    // Create form groups.
	    this.takenTranslations = this.fb.array([]);
	    this.form = this.fb.group({
		    translations: this.takenTranslations
	    });
	    this.availableTranslations = this.fb.array(this.languagePool.map(key => {
	    	return this.fb.group({
			    language: [key, [
				    Validators.required
			    ]],
			    translation: [this.defaultText, [
				    Validators.required,
			        Validators.minLength(5),
			        Validators.maxLength(32)
			    ]]
		    });
	    }));
        
        // Add initial language.
        this.addLanguage();
    }
    
    addLanguage(): void {
	    if(this.availableTranslations.length == 0) throw('There are no remaining languages available!');
	    
	    // Update language arrays.
	    let newLanguage = this.languagePool.find(language => !!this.availableTranslations.controls.find(control => control.value.language == language));
	    
	    // Move translation control.
	    let index = this.availableTranslations.controls.findIndex(control => control.value.language == newLanguage);
	    this.takenTranslations.push(this.availableTranslations.at(index));
	    this.availableTranslations.removeAt(index);
    }
    
    switchLanguage(original: Language, replacement: Language) {
    	// Move original from taken translations to available translations.
        let indexOriginal = this.takenTranslations.controls.findIndex(control => control.value.language == original);
	    this.availableTranslations.push(this.takenTranslations.at(indexOriginal));
        this.takenTranslations.removeAt(indexOriginal);
        
        // Move replacement from available translations to taken translations
	    let indexReplacement = this.availableTranslations.controls.findIndex(control => control.value.language == replacement);
        this.takenTranslations.insert(indexOriginal, this.availableTranslations.at(indexReplacement));
        this.availableTranslations.removeAt(indexReplacement);
    }
    
    deleteLanguage(language: Language): void {
        let index = this.takenTranslations.controls.findIndex(control => control.value.language == language);
        this.availableTranslations.push(this.takenTranslations.at(index));
        this.takenTranslations.removeAt(index);
    }
}
