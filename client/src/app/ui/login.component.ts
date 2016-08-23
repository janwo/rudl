import {Component} from "@angular/core";

@Component({
    template: require('./login.component.html'),
    styles: [ require('./login.component.scss') ],
    selector: 'login'
})
export class LoginComponent{

    private isCollapsed : boolean = true;

    public onLogin() : void {
        console.log('Clicked Login!');
    }

    constructor(){
    }
}
