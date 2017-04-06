import {Component, Input, Output, EventEmitter} from "@angular/core";
import {Router} from "@angular/router";
import {Locale} from "../../../models/locale";
import {ButtonStyles} from "../controls/styled-button.component";
import {ListService} from "../../../services/list.service";
import {ListRecipe} from "../../../models/list";
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
    recipe: ListRecipe = {
        translations: {},
        activities: []
    };
    buttonStyle: ButtonStyles = ButtonStyles.uncolored;
    
    constructor(
        private listService: ListService,
        private router: Router
    ) {}
    
    setTranslations(translations: Translations) {
        this.recipe.translations = translations;
    }
    
    cancel() {
        this.onCanceled.emit();
    }
    
    submit() {
        this.listService.create(this.recipe).subscribe(list => this.router.navigate(['/lists', list.id]));
    }
}