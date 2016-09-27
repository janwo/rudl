import {Component, OnInit} from "@angular/core";
import {UserService} from "../user.service";

@Component({
    template: require('./people.component.html'),
    styles: [require('./people.component.scss')]
})
export class PeopleComponent implements OnInit {
    
    followingUsers: any;
    
    constructor(
        private userService: UserService
    ) {}
    
    ngOnInit(){
        
    }
}
