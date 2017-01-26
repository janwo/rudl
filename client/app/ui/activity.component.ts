import {Component, OnInit, OnDestroy, ViewChild} from "@angular/core";
import {UserService} from "../services/user.service";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params} from "@angular/router";
import {Activity} from "../models/activity";
import {ButtonStyles} from "./widgets/styled-button.component";
import {ModalComponent} from "./widgets/modal.component";
import {List} from "../models/list";
import {MenuItem} from "./widgets/dropdown-menu.component";

@Component({
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit, OnDestroy {
    
    activity: Activity;
    listsMenuItems: MenuItem[];
    activitySubscription: Subscription;
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
        private userService: UserService,
        private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
        // Get params.
        this.route.params.forEach((params: Params) => {
            // Get selected tab.
            let key = params['key'];
            
            this.activitySubscription = this.userService.getActivity(key).subscribe(activity => this.activity = activity);
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
        let obs = this.activity.relations.isFollowed ? this.userService.unfollowActivity(this.activity.id) : this.userService.followActivity(this.activity.id);
        obs.do((updatedActivity: Activity) => {
            this.activity = updatedActivity;
            this.pendingFollowRequest = false;
        }).subscribe();
    }
    
    addToList(activity: Activity, list: List) {
        this.userService.addActivityToList(activity, list).subscribe(() => {
            
        });
    }
    
    toggleUserLists(): void {
        this.showUserLists = !this.showUserLists;
        this.userService.listsOfUser(null, true).subscribe((lists: List[]) => {
            this.listsMenuItems = lists.map(list => {
                return {
                    title: list.name,
                    icon: list.relations.isFollowed ? 'check' : 'close'
                };
            });
        });
    }
}
