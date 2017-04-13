import {Component, Input, OnInit} from "@angular/core";
import {UserService} from "../../../services/user.service";
import * as moment from "moment";
import {Expedition} from "../../../models/expedition";

@Component({
	templateUrl: 'expedition-item.component.html',
	styleUrls: ['expedition-item.component.scss'],
	selector: 'expedition-item'
})
export class ExpeditionItemComponent implements OnInit {
	
	@Input() expedition: Expedition;
	formattedDate: string;
	formattedLocation: string;
	formattedAwaitingApproval: string;
	
	constructor(
		private userService: UserService
	) {}
	
	ngOnInit(): void {
		let humanizedDate = moment.duration(moment().diff(this.expedition.date)).humanize();
		this.formattedDate = this.expedition.fuzzyTime ? `in about ${humanizedDate}` : `in ${humanizedDate}`;
		
		let distance = this.userService.getUsersDistance(this.expedition.location);
		distance = distance <= 10000 ? Math.ceil(distance / 100) / 10 : Math.ceil(distance / 1000);
		this.formattedLocation = this.expedition.needsApproval && !this.expedition.relations.isApproved ? `ca. ${distance} km` : `${distance} km`;
		
		switch(this.expedition.statistics.awaitingUsers) {
			case 0:
				this.formattedAwaitingApproval = 'Keine Anfragen';
				break;
			
			case 1:
				this.formattedAwaitingApproval = 'Eine Anfrage';
				break;
			
			default:
				this.formattedAwaitingApproval = `${this.expedition.statistics.awaitingUsers} Anfragen`;
				break;
		}
	}
}
