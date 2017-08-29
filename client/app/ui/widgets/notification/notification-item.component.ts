import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Notification} from "../../../models/notification";
import {NotificationType} from '../../../../../server/app/models/notification/Notification';
import {ExpeditionPreview} from '../../../models/expedition';
import {RudelPreview} from '../../../models/rudel';
import * as moment from 'moment';
import {UserPreview} from "../../../models/user";
import {UserService} from "../../../services/user.service";
import {Locale} from "../../../models/locale";

@Component({
	templateUrl: 'notification-item.component.html',
	styleUrls: ['notification-item.component.scss'],
	selector: 'notification-item'
})
export class NotificationItemComponent implements OnChanges, OnInit {
	
	@Input() notification: Notification;

	constructor(private userService: UserService) {}

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
		this.formattedDate = moment(this.notification.createdAt).fromNow();
		
		// Define subject type.
		switch(this.notification.type) {
			case NotificationType.JOINED_EXPEDITION:
			case NotificationType.LEFT_EXPEDITION:
			case NotificationType.REJECTED_FROM_EXPEDITION:
			case NotificationType.INVITED_TO_EXPEDITION:
			case NotificationType.ACCEPTED_INVITATION_FOR_EXPEDITION:
			case NotificationType.REJECTED_INVITATION_FOR_EXPEDITION:
			case NotificationType.APPLIED_FOR_EXPEDITION:
			case NotificationType.ACCEPTED_APPLICATION_FOR_EXPEDITION:
			case NotificationType.REJECTED_APPLICATION_FOR_EXPEDITION:
			case NotificationType.ADDED_EXPEDITION:
			case NotificationType.EXPEDITION_IS_TODAY:
            case NotificationType.COMMENTED_EXPEDITION:
				this.link = ['/expeditions', (this.notification.subject as ExpeditionPreview).id];
				this.emoji = (this.notification.subject as ExpeditionPreview).links.icon;
				break;

            case NotificationType.LIKES_RUDEL:
            case NotificationType.ADDED_RUDEL:
                this.link = ['/rudel', (this.notification.subject as RudelPreview).id];
                this.emoji = (this.notification.subject as RudelPreview).links.icon;
                (this.notification.subject as RudelPreview).name = Locale.getBestTranslation((this.notification.subject as RudelPreview).translations, this.userService.getAuthenticatedUser().user.languages);
                break;

            case NotificationType.LIKES_USER:
                this.link = ['/user', (this.notification.sender as UserPreview).username];
                break;
		}
		
		// Define message.
		switch(this.notification.type) {
			case NotificationType.APPLIED_FOR_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} ist an der Teilnahme von **${(this.notification.subject as ExpeditionPreview).title}** interessiert.`;
				this.link.push('attendees');
				break;

			case NotificationType.EXPEDITION_IS_TODAY:
                this.message = `Du nimmst heute an **${(this.notification.subject as ExpeditionPreview).title}** teil!`;
                break;

			case NotificationType.INVITED_TO_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} hat dich in **${(this.notification.subject as ExpeditionPreview).title}** eingeladen.`;
				break;
			
			case NotificationType.ADDED_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} hat **${(this.notification.subject as ExpeditionPreview).title}** erstellt.`;
				break;

            case NotificationType.LIKES_RUDEL:
                this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} interessiert sich für **${(this.notification.subject as RudelPreview).name}**.`;
                break;

            case NotificationType.LIKES_USER:
                this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} folgt dir jetzt.`;
                break;

            case NotificationType.COMMENTED_EXPEDITION:
                this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} hat etwas in die Diskussion für **${(this.notification.subject as ExpeditionPreview).title}** gepostet.`;
                this.link.push('discussion');
                break;
			
			case NotificationType.JOINED_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} nimmt an **${(this.notification.subject as ExpeditionPreview).title}** teil.`;
				break;
				
			case NotificationType.LEFT_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} nimmt nicht mehr an **${(this.notification.subject as ExpeditionPreview).title}** teil.`;
				break;
				
			case NotificationType.REJECTED_FROM_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} hat dich aus **${(this.notification.subject as ExpeditionPreview).title}** entfernt.`;
				break;
				
			case NotificationType.ACCEPTED_INVITATION_FOR_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} hat deine Einladung in **${(this.notification.subject as ExpeditionPreview).title}** angenommen.`;
				break;
				
			case NotificationType.REJECTED_INVITATION_FOR_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} hat deine Einladung in **${(this.notification.subject as ExpeditionPreview).title}** abgelehnt.`;
				break;
				
			case NotificationType.ACCEPTED_APPLICATION_FOR_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} hat deine Anfrage in **${(this.notification.subject as ExpeditionPreview).title}** angenommen.`;
				break;
				
			case NotificationType.REJECTED_APPLICATION_FOR_EXPEDITION:
				this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} hat deine Anfrage in **${(this.notification.subject as ExpeditionPreview).title}** abgelehnt.`;
				break;

            case NotificationType.ADDED_RUDEL:
                this.message = `${this.notification.sender.firstName} ${this.notification.sender.lastName} hat **${(this.notification.subject as RudelPreview).name}** erstellt.`;
                break;
		}
	}
}
