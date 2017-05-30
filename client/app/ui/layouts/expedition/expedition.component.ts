import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Expedition, ExpeditionRequestResponse} from '../../../models/expedition';
import * as moment from 'moment';
import {UserService} from '../../../services/user.service';
import {ButtonStyles} from '../../widgets/control/styled-button.component';
import {ModalComponent} from '../../widgets/modal/modal.component';
import {ExpeditionService} from '../../../services/expedition.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
	templateUrl: 'expedition.component.html',
	styleUrls: ['expedition.component.scss']
})
export class ExpeditionComponent implements OnInit {
	
	expedition: BehaviorSubject<Expedition> = new BehaviorSubject(null);
	formattedDate: string;
	formattedLocation: string;
	attendanceStatus: string;
	pendingAttendanceRequest: boolean;
	buttonStyleDefault: ButtonStyles = ButtonStyles.outlined;
	buttonStyleActivated: ButtonStyles = ButtonStyles.filled;
	@ViewChild('removeModal') removeModal: ModalComponent;
	
	modalChoices = [
		{
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
		}
	];
	
	constructor(private route: ActivatedRoute,
	            private userService: UserService,
	            private router: Router,
	            private expeditionService: ExpeditionService) {}
	
	ngOnInit() {
		// Define expedition subscription.
		this.expedition.filter(expedition => !!expedition).subscribe((expedition: Expedition) => {
			let humanizedDate = moment.duration(moment().diff(expedition.date.isoString)).humanize();
			this.formattedDate = expedition.date.accuracy > 0 ? `in about ${humanizedDate}` : `in ${humanizedDate}`;
			
			let distance = this.userService.getUsersDistance(expedition.location);
			distance = distance <= 10000 ? Math.ceil(distance / 100) / 10 : Math.ceil(distance / 1000);
			this.formattedLocation = expedition.location.accuracy > 0 ? `ca. ${distance} km` : `${distance} km`;
			
			this.attendanceStatus = 'Teilnehmen';
			if (expedition.relations.isOwned) this.attendanceStatus =  'Streifzug absagen';
			else if (expedition.relations.isAttendee) this.attendanceStatus =  'Nicht teilnehmen';
			else if (expedition.relations.isInvitee) this.attendanceStatus =  'Einladung annehmen';
			else if (expedition.relations.isApplicant) this.attendanceStatus =  'Anfrage zurückziehen';
			else if (expedition.needsApproval) this.attendanceStatus =  'Teilnahme anfragen';
		});
		
		// Define changed params subscription.
		this.route.data.subscribe((data: { expedition: Expedition }) => {
			this.expedition.next(data.expedition);
		});
	}
	
	onToggleAttendance(checkOwnerStatus: boolean = false): void {
		if (checkOwnerStatus && this.expedition.getValue().relations.isOwned) {
			this.removeModal.open();
			return;
		}
		
		this.pendingAttendanceRequest = true;
		let obs = this.expedition.getValue().relations.isAttendee || this.expedition.getValue().relations.isApplicant ? this.expeditionService.reject(this.expedition.getValue().id) : this.expeditionService.approve(this.expedition.getValue().id);
		obs.subscribe((expeditionRequestResponse: ExpeditionRequestResponse) => {
			this.pendingAttendanceRequest = false;
			
			// Set updated list.
			if (expeditionRequestResponse) {
				this.expedition.next(expeditionRequestResponse.expedition);
				return;
			}
			
			// Show delete message.
			this.router.navigate(['/expeditions/deleted-message']);
		});
	}
}
