import {Component, OnInit, OnDestroy} from "@angular/core";
import {UserService} from "../services/user.service";
import {Subscription, Observable} from "rxjs";
import {List} from "../models/list";
import {ActivatedRoute, Params} from "@angular/router";
import {Activity} from "../models/activity";

@Component({
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
    
    list: List;
    activities: Activity[];
    listSubscription: Subscription;
    
    constructor(
        private userService: UserService,
        private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
        // Get params.
        this.route.params.forEach((params: Params) => {
            // Get selected tab.
            let key = params['key'];
    
            this.listSubscription = Observable.zip(
                this.userService.list(key),
                this.userService.activities(key),
                (list: List, activities: Activity[]) => {
                    this.list = list;
                    this.activities = activities;
                }
            ).subscribe();
        });
    }
    
    ngOnDestroy(){
        this.listSubscription.unsubscribe();
    }
    
    string(string: string) {
        return JSON.stringify(string);
    }
}
