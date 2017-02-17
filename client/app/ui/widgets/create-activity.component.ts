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
import {ActivityService} from "../../services/activity.service";

@Component({
    templateUrl: './create-activity.component.html',
    styleUrls: ['./create-activity.component.scss'],
    selector: 'create-activity'
})
export class CreateActivityComponent {
    
    @Input() defaultName: string;
    @Output() onCanceled: EventEmitter<any> = new EventEmitter();
    translations: Locale.Translations = {};
    buttonStyle: ButtonStyles = ButtonStyles.uncolored;
    
    constructor(
        private activityService: ActivityService,
        private router: Router
    ) {}
    
    setTranslations(translations: Translations) {
        this.translations = translations;
    }
    
    cancel() {
        this.onCanceled.emit();
    }
    
    submit() {
        this.activityService.create(this.translations).subscribe(activity => {
            this.router.navigate(['/activities', activity.id]);
        })
    }
}
