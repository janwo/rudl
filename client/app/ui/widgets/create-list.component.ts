import {
    Component, OnInit, OnDestroy, ViewChild, Input, ElementRef, AfterViewInit, Output,
    EventEmitter, trigger, transition, style, animate
} from "@angular/core";
import {UserService} from "../../services/user.service";
import {Router} from "@angular/router";
import {Locale} from "../../models/locale";
import Language = Locale.Language;
import {ButtonStyles} from "./styled-button.component";
import Translations = Locale.Translations;
import {ListService} from "../../services/list.service";

@Component({
    templateUrl: './create-list.component.html',
    styleUrls: ['./create-list.component.scss'],
    selector: 'create-list'
})
export class CreateListComponent {
    
    @Input() defaultName: string;
    @Output() onCanceled: EventEmitter<any> = new EventEmitter();
    translations: Locale.Translations = {};
    buttonStyle: ButtonStyles = ButtonStyles.uncolored;
    
    constructor(
        private listService: ListService,
        private router: Router
    ) {}
    
    setTranslations(translations: Translations) {
        this.translations = translations;
    }
    
    cancel() {
        this.onCanceled.emit();
    }
    
    submit() {
        this.listService.create(this.translations).subscribe(list => {
            this.router.navigate(['/lists', list.id]);
        })
    }
}
