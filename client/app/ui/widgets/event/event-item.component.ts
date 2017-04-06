import {Component, Input, OnInit} from "@angular/core";
import {Event} from "../../../models/event";
import {UserService} from "../../../services/user.service";
import * as moment from "moment";

@Component({
	templateUrl: 'event-item.component.html',
	styleUrls: ['event-item.component.scss'],
	selector: 'event-item'
})
export class EventItemComponent implements OnInit {
	
	@Input() event: Event;
	formattedDate: string;
	formattedLocation: string;
	formattedAwaitingApproval: string;
	
	constructor(
		private userService: UserService
	) {}
	
	ngOnInit(): void {
		let humanizedDate = moment.duration(moment().diff(this.event.date)).humanize();
		this.formattedDate = this.event.fuzzyTime ? `in about ${humanizedDate}` : `in ${humanizedDate}`;
		
		let distance = this.userService.getUsersDistance(this.event.location);
		distance = distance <= 10000 ? Math.ceil(distance / 100) / 10 : Math.ceil(distance / 1000);
		this.formattedLocation = this.event.needsApproval && !this.event.relations.isApproved ? `ca. ${distance} km` : `${distance} km`;
		
		switch(this.event.statistics.awaitingUsers) {
			case 0:
				this.formattedAwaitingApproval = 'Keine Anfragen';
				break;
			
			case 1:
				this.formattedAwaitingApproval = 'Eine Anfrage';
				break;
			
			default:
				this.formattedAwaitingApproval = `${this.event.statistics.awaitingUsers} Anfragen`;
				break;
		}
	}
}
