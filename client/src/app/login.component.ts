import {Component, ViewEncapsulation} from "@angular/core";

@Component({
    template: require('./login.component.html'),
    styles: [
        require('./login.component.scss'),
        require('./styles/card.scss')
    ],
    selector: 'login'
})
export class LoginComponent{

    public onLogin() : void {
        console.log('Clicked Login!');
    }

    constructor(){
    }
}
