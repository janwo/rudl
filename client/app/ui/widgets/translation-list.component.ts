import {
    Component, OnInit, OnDestroy, ViewChild, Input, ElementRef, AfterViewInit, Output,
    EventEmitter, trigger, transition, style, animate, state
} from "@angular/core";
import {UserService} from "../../services/user.service";
import {Router} from "@angular/router";
import {Locale} from "../../models/locale";
import Language = Locale.Language;
import {MenuItem} from "./dropdown-menu.component";
import languages = Locale.languages;
import {ButtonStyles} from "./styled-button.component";
import Translations = Locale.Translations;

@Component({
    templateUrl: './translation-list.component.html',
    styleUrls: ['./translation-list.component.scss'],
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
    @Output() onTranslationChanged: EventEmitter<Translations> = new EventEmitter();
    translations: Locale.Translations = {};
    takenLanguages: Language[] = [];
    availableLanguages: Language[] = Locale.languages;
    languagePool: Language[] = [];
    buttonStyle: ButtonStyles = ButtonStyles.uncolored;
    
    constructor(
        private userService: UserService
    ) {}
    
    ngOnInit(){
        let userLanguages = this.userService.getAuthenticatedUser().user.languages;
        this.languagePool = Locale.languages.sort(a => {
            // Put it to the front.
            if(userLanguages.indexOf(a) >= 0) return -1;
        
            // Put it to the back.
            return 1;
        });
        
        // Add initial language.
        this.addLanguage(this.defaultText);
    }
    
    setTranslationText(language: Language, text: string) {
        this.translations[language] = text;
        this.emitTranslations();
    }
    
    emitTranslations(): void {
        let translations : Translations = {};
        this.takenLanguages.forEach(language => translations[language] = this.translations[language] ? this.translations[language].trim() : '');
        this.onTranslationChanged.emit(translations);
    }
    
    addLanguage(text: string = null): void {
        if(this.availableLanguages.length == 0) throw('There are no remaining languages available!');
        let newLanguage = this.languagePool.find(language => this.availableLanguages.indexOf(language) >= 0);
        this.takenLanguages.push(newLanguage);
        this.availableLanguages = this.availableLanguages.filter(language => language !== newLanguage);
        this.translations[newLanguage] = text;
        this.emitTranslations();
    }
    
    switchLanguage(language: Language, replacement: Language) {
        let index = this.takenLanguages.indexOf(language);
        this.takenLanguages[index] = replacement;
        this.availableLanguages.push(language);
        this.availableLanguages = this.availableLanguages.filter(language => language != replacement);
        this.emitTranslations();
    }
    
    deleteLanguage(language: Language): void {
        this.takenLanguages = this.takenLanguages.filter(takenLanguage => takenLanguage != language);
        this.availableLanguages.push(language);
        this.emitTranslations();
    }
    
    buildMenuItems(takenLanguage: Language): MenuItem[] {
        return this.languagePool.filter(language => this.availableLanguages.indexOf(language) >= 0).map(language => {
            return {
                title: language,
                click: () => this.switchLanguage(takenLanguage, language)
            };
        });
    }
}
