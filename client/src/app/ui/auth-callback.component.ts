import {Component} from "@angular/core";
import {DataService} from "../data.service";
import {AuthService} from "../auth.service";

@Component({
    template: require('./auth-callback.component.html'),
    styles: [require('./auth-callback.component.scss')]
})
export class AuthCallbackComponent {

    constructor() {
        let metaElement = document.querySelector('meta[name="token"]');
        let token = metaElement.getAttribute('content');

        window.opener.postMessage({
            type: AuthService.callbackMessageType,
            message: {
                token: token
            }
        }, DataService.domain);
        console.log('test');

        window.close();
    }
}
