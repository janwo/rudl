import {Component, OnInit, ViewChild} from "@angular/core";
import {List} from "../../../models/list";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {ModalComponent} from "../../widgets/modal/modal.component";
import {ListService} from "../../../services/list.service";

@Component({
    templateUrl: 'list.component.html',
    styleUrls: ['list.component.scss']
})
export class ListComponent implements OnInit {
    
    list: List;
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
        private route: ActivatedRoute,
        private router: Router
    ) {}
    
    ngOnInit(){
        // Get params.
        this.route.params.forEach((params: Params) => {
	        // Define changed params subscription.
	        this.route.data.subscribe((data: { list: List }) => this.list = data.list);
        });
    }
    
    onToggleFollow(checkOwnerStatus: boolean = false): void {
        if(checkOwnerStatus && this.list.relations.isOwned) {
            this.unfollowModal.open();
            return;
        }
        
        this.pendingFollowRequest = true;
        let obs = this.list.relations.isFollowed ? this.listService.unfollow(this.list.id) : this.listService.follow(this.list.id);
        obs.subscribe((updatedList: List) => {
            this.pendingFollowRequest = false;
            
            // Set updated list.
            if(updatedList) {
                this.list = updatedList;
                return;
            }
            
            // Show delete message.
	        this.router.navigate(['/lists/deleted-message']);
        });
    }
}
