import {Component} from "@angular/core";

@Component({
    template: require('./app.component.html'),
    styles: [ require('./app.component.scss') ],
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
