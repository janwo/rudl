import {Component, OnInit, OnDestroy, ViewChild, Input, ElementRef, AfterViewInit} from "@angular/core";
import {UserService} from "../services/user.service";
import {Router} from "@angular/router";
import {Locale} from "../models/locale";

@Component({
    templateUrl: './create-activity.component.html',
    styleUrls: ['./create-activity.component.scss'],
    selector: 'create-activity'
})
export class CreateActivityComponent implements AfterViewInit, OnInit, OnDestroy {
    
    @Input() name: string;
    @ViewChild('select') select: ElementRef;
    
    constructor(
        private userService: UserService,
        private router: Router
    ) {}
    
    ngOnInit(){
    }
    
    ngOnDestroy(){
       
    }
    
    ngAfterViewInit(): void {
    }
    
    changedLanguage(language: string) {
        console.log(language);
    }
    
    submit(language: string) {
        let translations : Locale.Translations = {};
        translations[language] = this.name;
        this.userService.createActivity(translations).subscribe(activity => {
            this.router.navigate(['/activities', activity.id]);
        })
    }
}
