import {Component, Input} from "@angular/core";

export enum UserSuggestionsType {
    GENERAL, NEARBY
}

export class someUser {

    id: number;

    constructor(id: number) {
        this.id = id;
    }
}

@Component({
    template: require('./explore.component.html'),
    styles: [require('./explore.component.scss')]
})
export class ExploreComponent {

    @Input() type: UserSuggestionsType = UserSuggestionsType.GENERAL;
    types: UserSuggestionsType;
    users: someUser[] = [
        new someUser(2),
        new someUser(3)
    ];

    constructor() {
    }
}
