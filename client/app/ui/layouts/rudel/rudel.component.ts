import {Component, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Rudel} from "../../../models/rudel";
import {ButtonStyles} from "../../widgets/control/styled-button.component";
import {ModalComponent} from "../../widgets/modal/modal.component";
import {RudelService} from "../../../services/rudel.service";

@Component({
    templateUrl: 'rudel.component.html',
    styleUrls: ['rudel.component.scss']
})
export class RudelComponent implements OnInit {
	
    rudel: Rudel;
    pendingFollowRequest: boolean = false;
    buttonStyleDefault: ButtonStyles = ButtonStyles.outlined;
    buttonStyleActivated: ButtonStyles = ButtonStyles.filled;
    @ViewChild('unfollowModal') unfollowModal: ModalComponent;
	
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
	    private rudelService: RudelService,
        private route: ActivatedRoute,
        private router: Router
    ) {}
    
    ngOnInit(){
        // Define changed params subscription.
	    this.route.data.subscribe((data: { rudel: Rudel }) => this.rudel = data.rudel);
    }
    
    onToggleFollow(checkOwnerStatus: boolean = false): void {
        if(checkOwnerStatus && this.rudel.relations.isOwned) {
            this.unfollowModal.open();
            return;
        }
        
        this.pendingFollowRequest = true;
        let obs = this.rudel.relations.isFollowed ? this.rudelService.unfollow(this.rudel.id) : this.rudelService.follow(this.rudel.id);
        obs.subscribe((updatedRudel: Rudel) => {
            this.pendingFollowRequest = false;
            
            // Set updated list.
            if(updatedRudel) {
                this.rudel = updatedRudel;
                return;
            }
    
            // Show delete message.
            this.router.navigate(['/rudel/deleted-message']);
        });
    }
}
