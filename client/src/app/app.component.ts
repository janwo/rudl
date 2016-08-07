import {Component, ViewEncapsulation} from "@angular/core";
import {LoginComponent} from "./login.component";
import {UserSuggestionsComponent} from "./user-suggestions.component";

@Component({
    template: require('./app.component.html'),
    styles: [ require('./app.component.scss') ],
    directives: [LoginComponent, UserSuggestionsComponent],
    selector: 'app'
})
export class AppComponent{
    private titleName: string;
    private userId : number;

    constructor(){
        this.titleName = "eat.together";
        this.userId = undefined;
    }
}
