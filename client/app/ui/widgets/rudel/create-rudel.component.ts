import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Locale} from '../../../models/locale';
import {ButtonStyles} from '../control/styled-button.component';
import {RudelService} from '../../../services/rudel.service';
import {Rudel, RudelRecipe} from '../../../models/rudel';
import {TranslationListComponent} from '../translation/translation-list.component';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import Language = Locale.Language;
import Translations = Locale.Translations;

@Component({
	templateUrl: 'create-rudel.component.html',
	styleUrls: ['create-rudel.component.scss'],
	selector: 'create-rudel'
})
export class CreateRudelComponent implements OnInit {
	
	@Input() defaultName: string;
	@Output() onCanceled: EventEmitter<any> = new EventEmitter();
	@ViewChild(TranslationListComponent) translationList: TranslationListComponent;
	form: FormGroup;
	@Input() rudel: Rudel;
	
	submitPending: boolean;
	cancelButtonStyle: ButtonStyles = ButtonStyles.outlined;
	
	constructor(private rudelService: RudelService,
	            private router: Router,
	            private fb: FormBuilder) {}
	
	ngOnInit(): void {
		let translations = this.fb.array([]);
		if (this.rudel) Object.keys(this.rudel.translations).forEach(key => this.fb.group({
			language: [key],
			translation: [this.rudel.translations[key]]
		}));
		
		this.form = this.fb.group({
			translations: translations,
			icon: [
				this.rudel ? this.rudel.icon : null, [
					Validators.required
				]
			]
		});
	}
	
	
	cancel() {
		this.onCanceled.emit();
	}
	
	submit() {
		this.translationList.markAsTouched();
		this.form.controls.icon.markAsTouched();
		if (!this.form.valid) return;
		
		// Mark as pending.
		this.submitPending = true;
		
		// Create rudel recipe.
		let rudelRecipe: RudelRecipe = {
			translations: {},
			icon: this.form.controls.icon.value
		};
		
		// Fire and remove pending state when done.
		this.translationList.takenTranslations.value.forEach((translation: {
			language: string, translation: string
		}) => rudelRecipe.translations[translation.language] = translation.translation);
		
		this.rudelService.create(rudelRecipe).subscribe(rudel => {
			this.submitPending = false;
			this.router.navigate(['/rudel', rudel.id]);
		}, error => {
			this.submitPending = false;
			alert(error.message);
		});
	}
}
