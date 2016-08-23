import {Component, Input} from "@angular/core";

export enum UserSuggestionsType {
    GENERAL, NEARBY
}

export class User {

    private id: number;

    constructor(id) {
        this.id = id;
    }
}

@Component({
    template: require('./user-suggestions.component.html'),
    styles: [ require('./user-suggestions.component.scss') ],
    selector: 'user-suggestions'
})
export class UserSuggestionsComponent{

    @Input() type : UserSuggestionsType = UserSuggestionsType.GENERAL;
    public types : UserSuggestionsType;
    private users : User[] = [
        new User(2),
        new User(3)
    ];

    constructor(){
    }
}
