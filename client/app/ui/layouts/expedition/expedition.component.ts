import {Component, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {EmptyState} from "../../widgets/state/empty.component";
import {Expedition} from "../../../models/expedition";
import * as moment from "moment";
import {UserService} from "../../../services/user.service";
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {ModalComponent} from '../../widgets/modal/modal.component';
import {ExpeditionService} from '../../../services/expedition.service';

@Component({
    templateUrl: 'expedition.component.html',
    styleUrls: ['expedition.component.scss']
})
export class ExpeditionComponent implements OnInit {
    
    expedition: Expedition;
	formattedDate: string;
	formattedLocation: string;
	pendingAttendanceRequest: boolean;
	buttonStyleDefault: ButtonStyles = ButtonStyles.outlined;
	buttonStyleActivated: ButtonStyles = ButtonStyles.filled;
	@ViewChild('removeModal') removeModal: ModalComponent;
	
	modalChoices = [{
		style: ButtonStyles.filledInverse,
		text: 'Abbrechen',
		callback: () => this.removeModal.close()
	}, {
		style: ButtonStyles.outlinedInverse,
		text: 'Absagen',
		callback: () => {
			this.removeModal.close();
			this.onToggleAttendance();
		}
	}];
	
    constructor(
	    private route: ActivatedRoute,
	    private userService: UserService,
	    private router: Router,
	    private expeditionService: ExpeditionService
    ) {}
    
    ngOnInit(){
        // Define changed params subscription.
        this.route.data.subscribe((data: { expedition: Expedition }) => {
            this.expedition = data.expedition;
         
	        let humanizedDate = moment.duration(moment().diff(this.expedition.date.isoString)).humanize();
	        this.formattedDate = this.expedition.date.accuracy > 0 ? `in about ${humanizedDate}` : `in ${humanizedDate}`;
	
	        let distance = this.userService.getUsersDistance(this.expedition.location);
	        distance = distance <= 10000 ? Math.ceil(distance / 100) / 10 : Math.ceil(distance / 1000);
	        this.formattedLocation = this.expedition.location.accuracy > 0 ? `ca. ${distance} km` : `${distance} km`;
        });
    }
    
    getToggleAttendeeText(): string {
	    if(this.expedition.relations.isOwned) return 'Streifzug absagen';
	    if(this.expedition.relations.isAttendee) return 'Nicht teilnehmen';
	    if(this.expedition.relations.isInvitee) return 'Einladung annehmen';
	    if(this.expedition.relations.isApplicant) return 'Anfrage zurückziehen';
	    if(this.expedition.needsApproval) return 'Teilnahme anfragen';
	    return 'Teilnehmen';
    }
	
	onToggleAttendance(checkOwnerStatus: boolean = false): void {
		if(checkOwnerStatus && this.expedition.relations.isOwned) {
			this.removeModal.open();
			return;
		}
		
		this.pendingAttendanceRequest = true;
		let obs = this.expedition.relations.isAttendee || this.expedition.relations.isApplicant ? this.expeditionService.reject(this.expedition.id) : this.expeditionService.approve(this.expedition.id);
		obs.subscribe((updatedExpedition: Expedition) => {
			this.pendingAttendanceRequest = false;
			
			// Set updated list.
			if(updatedExpedition) {
				this.expedition = updatedExpedition;
				return;
			}
			
			// Show delete message.
			this.router.navigate(['/expeditions/deleted-message']);
		});
	}
}
