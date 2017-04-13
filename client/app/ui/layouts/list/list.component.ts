import {Component, OnInit, OnDestroy, ViewChild} from "@angular/core";
import {Subscription, Observable} from "rxjs";
import {List} from "../../../models/list";
import {ActivatedRoute, Params} from "@angular/router";
import {Activity} from "../../../models/activity";
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {ModalComponent} from "../../widgets/modal/modal.component";
import {ListService} from "../../../services/list.service";

@Component({
    templateUrl: 'list.component.html',
    styleUrls: ['list.component.scss']
})
export class ListComponent implements OnInit {
    
    list: List;
    activities: Activity[];
    pendingFollowRequest: boolean = false;
    buttonStyleDefault: ButtonStyles = ButtonStyles.outlined;
    buttonStyleFollowing: ButtonStyles = ButtonStyles.filled;
    @ViewChild(ModalComponent) unfollowModal: ModalComponent;
    modalChoices = [{
        style: ButtonStyles.filledInverse,
        text: 'Abbrechen',
        callback: () => this.unfollowModal.close()
    }, {
        style: ButtonStyles.outlinedInverse,
        text: 'Entfolgen',
        callback: () => {
            this.unfollowModal.close();
            this.onToggleFollow();
        }
    }];
    
    constructor(
        private listService: ListService,
        private route: ActivatedRoute
    ) {}
    
    ngOnInit(){
        // Get params.
        this.route.params.forEach((params: Params) => {
	        // Define changed params subscription.
	        this.route.data.subscribe((data: { list: List }) => {
		        this.list = data.list;
		        this.listService.activities(data.list.id).subscribe((activities: Activity[]) => this.activities = activities);
	        });
        });
    }
    
    onToggleFollow(checkOwnerStatus: boolean = false): void {
        if(checkOwnerStatus && this.list.relations.isOwned) {
            this.unfollowModal.open();
            return;
        }
        
        this.pendingFollowRequest = true;
        let obs = this.list.relations.isFollowed ? this.listService.unfollow(this.list.id) : this.listService.follow(this.list.id);
        obs.do((updatedList: List) => {
            this.list = updatedList;
            this.pendingFollowRequest = false;
        }).subscribe();
    }
}
