import {Component, OnInit, OnDestroy, ViewChild} from "@angular/core";
import {UserService} from "../services/user.service";
import {Subscription, Observable} from "rxjs";
import {ActivatedRoute, Params} from "@angular/router";
import {Activity} from "../models/activity";
import {ButtonStyles} from "./widgets/styled-button.component";
import {ModalComponent} from "./widgets/modal.component";
import {List} from "../models/list";
import {MenuItem} from "./widgets/dropdown-menu.component";
import {ActivityService} from "../services/activity.service";
import {ListService} from "../services/list.service";

@Component({
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit, OnDestroy {
    
    activity: Activity;
    listsMenuItems: MenuItem[];
    activitySubscription: Subscription;
    listMenuItemsObservable: Observable<MenuItem[]>;
    pendingFollowRequest: boolean = false;
    buttonStyleDefault: ButtonStyles = ButtonStyles.minimal;
    buttonStyleActivated: ButtonStyles = ButtonStyles.minimalInverse;
    showUserLists: boolean = false;
    @ViewChild(ModalComponent) unfollowModal: ModalComponent;
    
    modalChoices = [{
        buttonStyle: ButtonStyles.default,
        text: 'Abbrechen',
        callback: () => this.unfollowModal.close()
    }, {
        buttonStyle: ButtonStyles.uncolored,
        text: 'Entfolgen',
        callback: () => {
            this.unfollowModal.close();
            this.onToggleFollow();
        }
    }];
    
    constructor(
        private activityService: ActivityService,
        private listService: ListService,
        private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
        // Get params.
        this.route.params.forEach((params: Params) => {
            // Get selected tab.
            let key = params['key'];
            
            // Create activity subscription.
            this.activitySubscription = this.activityService.get(key).subscribe(activity => this.activity = activity);
    
            // Create "add to list"-button observable.
            this.listMenuItemsObservable = Observable.zip(
                this.listService.by(null, true),
                this.activityService.lists(key, 'owned').map((lists: List[]) => lists.map((list: List) => list.id))
            ).map((lists: [List[], string[]]) => {
                let allLists = lists[0];
                let ownedLists = lists[1];
                
                return allLists.map(list => {
                    let owned = ownedLists.indexOf(list.id) >= 0;
                    
                    return {
                        title: list.name,
                        icon: owned ? 'check' : 'close',//TODO aktualsiieren
                        click: () => owned ? this.listService.deleteActivity(this.activity.id, list.id).subscribe(()=>{}) : this.listService.addActivity(this.activity.id, list.id).subscribe(()=>{})
                    };
                }) as MenuItem[];
            }).share();
        });
        
    }
    
    ngOnDestroy(){
        this.activitySubscription.unsubscribe();
    }
    
    onToggleFollow(checkOwnerStatus: boolean = false): void {
        if(checkOwnerStatus && this.activity.relations.isOwned) {
            this.unfollowModal.open();
            return;
        }
        
        this.pendingFollowRequest = true;
        let obs = this.activity.relations.isFollowed ? this.activityService.unfollow(this.activity.id) : this.activityService.follow(this.activity.id);
        obs.do((updatedActivity: Activity) => {
            this.activity = updatedActivity;
            this.pendingFollowRequest = false;
        }).subscribe();
    }
    
    toggleUserLists(): void {
        this.showUserLists = !this.showUserLists;
        this.listMenuItemsObservable.subscribe((items: MenuItem[]) => this.listsMenuItems = items);
    }
}
