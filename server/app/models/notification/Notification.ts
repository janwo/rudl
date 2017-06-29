import {User} from '../user/User';
import {Node} from '../Node';

export interface Notification {
	type: NotificationType;
	sender: User;
	subject: Node,
	unread: boolean;
	createdAt: number
}

export enum NotificationType {
	ADDED_EXPEDITION = 0, // TODO
	JOINED_EXPEDITION = 1,// TODO @ APPROVE ALL
	LEFT_EXPEDITION = 2,
	REJECTED_FROM_EXPEDITION = 3,
	INVITED_TO_EXPEDITION = 4,
	ACCEPTED_INVITATION_FOR_EXPEDITION = 5,
	REJECTED_INVITATION_FOR_EXPEDITION = 6,
	APPLIED_FOR_EXPEDITION = 7,
	ACCEPTED_APPLICATION_FOR_EXPEDITION = 8,
	REJECTED_APPLICATION_FOR_EXPEDITION = 9,
	LIKES_RUDEL = 10// TODO
}
