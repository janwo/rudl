import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Notification} from "../../../models/notification";
import {NotificationType} from '../../../../../server/app/models/notification/Notification';
import {ExpeditionPreview} from '../../../models/expedition';
import {RudelPreview} from '../../../models/rudel';
import * as moment from 'moment';

@Component({
	templateUrl: 'notification-item.component.html',
	styleUrls: ['notification-item.component.scss'],
	selector: 'notification-item'
})
export class NotificationItemComponent implements OnChanges, OnInit {
	
	@Input() notification: Notification;
	message: string;
	formattedDate: string;
	link: string[];
	emoji: string;
	
	ngOnInit(): void {
		this.updateNotification();
	}
	
	ngOnChanges(changes: SimpleChanges): void {
		if(changes.notification) this.updateNotification();
	}
	
	updateNotification(): void {
		// Define notification date.
		let humanizedDate = moment.duration(moment().diff(this.notification.createdAt)).humanize();
		this.formattedDate = `${humanizedDate} ago`;
		
		// Define subject type.
		switch(this.notification.type) {
			case NotificationType.APPLIED_FOR_EXPEDITION:
			case NotificationType.INVITED_TO_EXPEDITION:
			case NotificationType.ADDED_EXPEDITION:
				this.link = ['/expeditions', (this.notification.subject as ExpeditionPreview).id];
				this.emoji = (this.notification.subject as ExpeditionPreview).links.icon;
				break;
			
			case NotificationType.JOINED_RUDEL:
				this.link = ['/rudel', (this.notification.subject as RudelPreview).id];
				this.emoji = (this.notification.subject as RudelPreview).links.icon;
				break;
		}
		
		// Define message.
		switch(this.notification.type) {
			case NotificationType.APPLIED_FOR_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} ist an der Teilnahme von **${(this.notification.subject as ExpeditionPreview).title}** interessiert.`;
				break;
			
			case NotificationType.INVITED_TO_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} hat dich in **${(this.notification.subject as ExpeditionPreview).title}** eingeladen.`;
				break;
			
			case NotificationType.ADDED_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} hat **${(this.notification.subject as ExpeditionPreview).title}** erstellt.`;
				break;
			
			case NotificationType.JOINED_RUDEL:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} nimmt an **${(this.notification.subject as ExpeditionPreview).title}** teil.`;
				break;
		}
	}
}
