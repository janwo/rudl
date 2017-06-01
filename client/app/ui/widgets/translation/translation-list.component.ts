import {Component, Input, OnInit, Output} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import {UserService} from '../../../services/user.service';
import {Locale} from '../../../models/locale';
import {ButtonStyles} from '../control/styled-button.component';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import Language = Locale.Language;
import languages = Locale.languages;
import Translations = Locale.Translations;

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
	@Input() @Output() takenTranslations: FormArray = this.fb.array([]);
	
	availableTranslations: FormArray;
	buttonStyle: ButtonStyles = ButtonStyles.filledInverseShadowed;
	languagePool: string[];
	languageNames = Locale.languageNames;
	
	constructor(private userService: UserService,
	            private fb: FormBuilder) {}
	
	markAsTouched(): void {
		this.takenTranslations.controls.forEach((control: FormGroup) => control.controls.translation.markAsTouched());
	}
	
	ngOnInit() {
		// Get sorted language pool.
		let userLanguages = this.userService.getAuthenticatedUser().user.languages;
		this.languagePool = Locale.languages.slice().sort(a => {
			// Put it to the front.
			if (userLanguages.indexOf(a) >= 0) return -1;
			
			// Put it to the back.
			return 1;
		});
		
		// Create form groups.
		this.availableTranslations = this.fb.array(this.languagePool.filter(key => {
			return (<any[]>this.takenTranslations.controls).findIndex(control => control.get('language').value == key) < 0;
		}).map(key => {
			return this.fb.group({
				language: [key],
				translation: [this.defaultText]
			});
		}));
		
		// Set validators.
		let validators: any = {
			language: [
				Validators.required
			],
			translation: [
				Validators.required,
				Validators.minLength(5),
				Validators.maxLength(50)
			]
		};
		
		Object.keys(validators).forEach(key => {
			this.takenTranslations.controls.forEach(control => control.get(key).setValidators(validators[key]));
			this.availableTranslations.controls.forEach(control => control.get(key).setValidators(validators[key]));
		});
		
		// Add initial language.
		if (this.takenTranslations.controls.length == 0) this.addLanguage();
	}
	
	addLanguage(): void {
		if (this.availableTranslations.length == 0) throw('There are no remaining languages available!');
		
		// Update language arrays.
		let newLanguage = this.languagePool.find(language => !!this.availableTranslations.controls.find(control => control.value.language == language));
		
		// Move translation control.
		let index = this.availableTranslations.controls.findIndex(control => control.value.language == newLanguage);
		let formControl: AbstractControl = this.availableTranslations.at(index);
		this.availableTranslations.removeAt(index);
		this.takenTranslations.push(formControl);
	}
	
	switchLanguage(original: Language, replacement: Language) {
		// Move original from taken translations to available translations.
		let indexOriginal = this.takenTranslations.controls.findIndex(control => control.value.language == original);
		let formControl: AbstractControl = this.takenTranslations.at(indexOriginal);
		this.takenTranslations.removeAt(indexOriginal);
		this.availableTranslations.push(formControl);
		
		// Move replacement from available translations to taken translations
		let indexReplacement = this.availableTranslations.controls.findIndex(control => control.value.language == replacement);
		formControl = this.availableTranslations.at(indexReplacement);
		this.availableTranslations.removeAt(indexReplacement);
		this.takenTranslations.insert(indexOriginal, formControl);
	}
	
	deleteLanguage(language: Language): void {
		let index = this.takenTranslations.controls.findIndex(control => control.value.language == language);
		let formControl = this.takenTranslations.at(index);
		this.takenTranslations.removeAt(index);
		this.availableTranslations.push(formControl);
	}
	
	formControlCount(value: string, maxChars: number = 0): (value: string) => {} {
		return (value: string) => `${value ? value.length : 0} of ${maxChars} characters used`;
	}
}
