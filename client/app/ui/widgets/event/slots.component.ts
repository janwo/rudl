import {Component, Input} from "@angular/core";
import {User} from "../../../models/user";

@Component({
    templateUrl: 'slots.component.html',
    styleUrls:  ['slots.component.scss'],
    selector: 'slots'
})
export class SlotsComponent {
    
    @Input() slots: number;
    @Input() users: User[];

    constructor() {}
}
