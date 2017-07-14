import {Component, Input, OnInit} from '@angular/core';
import {UserService} from '../../../services/user.service';
import * as moment from 'moment';
import {Expedition} from '../../../models/expedition';
import {Locale} from "../../../../../server/app/models/Translations";

@Component({
	templateUrl: 'expedition-item.component.html',
	styleUrls: ['expedition-item.component.scss'],
	selector: 'expedition-item'
})
export class ExpeditionItemComponent implements OnInit {
	
	@Input() expedition: Expedition;
	@Input() style: ExpeditionItemStyles = ExpeditionItemStyles.list;

	formattedDate: string;
	formattedLocation: string;
	formattedAwaitingApproval: string;
	
	constructor(private userService: UserService) {}
	
	ngOnInit(): void {
		this.formattedDate = `${this.expedition.date.accuracy > 0 ? 'ca.' : ''}${moment(this.expedition.date.isoString).fromNow()}`;

		let distance = this.userService.getUsersDistance(this.expedition.location);
		distance = distance <= 10000 ? Math.ceil(distance / 100) / 10 : Math.ceil(distance / 1000);
		this.formattedLocation = this.expedition.location.accuracy > 0 ? `ca. ${distance} km` : `${distance} km`;
		
		// Awaiting approval formatting.
		switch (this.expedition.statistics.applicants) {
			case 0:
				this.formattedAwaitingApproval = 'Keine Anfragen';
				break;
			
			case 1:
				this.formattedAwaitingApproval = 'Eine Anfrage';
				break;
			
			default:
				this.formattedAwaitingApproval = `${this.expedition.statistics.applicants} Anfragen`;
				break;
		}
	}
	
	
	getStyleClass(): string {
		switch (this.style) {
			case ExpeditionItemStyles.block:
				return 'card block';
			
			case ExpeditionItemStyles.list:
				return 'card list';
		}
	}
}

export enum ExpeditionItemStyles {
	list,
	block
}
