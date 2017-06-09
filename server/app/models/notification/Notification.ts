import {User} from '../user/User';

export interface Notification extends Node {
	type: NotificationType;
	sender: User;
	subject: Document
}

export enum NotificationType {
	INVITED_TO_EXPEDITION = 0,
	APPLIED_FOR_EXPEDITION = 1,
	JOINED_RUDEL = 2,
	ADDED_EXPEDITION = 3,
}
