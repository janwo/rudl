import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Locale} from '../../../models/locale';
import {ButtonStyles} from '../control/styled-button.component';
import {ListService} from '../../../services/list.service';
import {ListRecipe} from '../../../models/list';
import {TranslationListComponent} from '../translation/translation-list.component';
import Language = Locale.Language;
import Translations = Locale.Translations;

@Component({
	templateUrl: 'create-list.component.html',
	styleUrls: ['create-list.component.scss'],
	selector: 'create-list'
})
export class CreateListComponent {
	
	@Input() defaultName: string;
	@Output() onCanceled: EventEmitter<any> = new EventEmitter();
	@ViewChild(TranslationListComponent) translationList: TranslationListComponent;
	
	submitPending: boolean;
	cancelButtonStyle: ButtonStyles = ButtonStyles.outlined;
	
	constructor(private listService: ListService,
	            private router: Router) {}
	
	cancel() {
		this.onCanceled.emit();
	}
	
	submit() {
		this.translationList.markAsTouched();
		if (!this.translationList.takenTranslations.valid) return;
		
		// Mark as pending.
		this.submitPending = true;
		
		// Create rudel recipe.
		let listRecipe: ListRecipe = {
			translations: {}
		};
		
		// Fire and remove pending state when done.
		this.translationList.takenTranslations.value.forEach((translation: {
			language: string, translation: string
		}) => listRecipe.translations[translation.language] = translation.translation);
		
		this.listService.create(listRecipe).subscribe(list => {
			this.submitPending = false;
			this.router.navigate(['/lists', list.id]);
		}, error => {
			this.submitPending = false;
			alert(error.message);
		});
	}
}
