import {Document} from './document';
import {User, UserPreview} from './user';
import {Rudel, RudelPreview} from './rudel';
import {VagueLocation} from './location';

export interface ExpeditionPreview extends Document {
	title: string;
	icon: string;
	links: ExpeditionLinks;
	description: string;
}

export interface Expedition extends ExpeditionPreview {
	location: VagueLocation;
	date: {
		accuracy: number,
		isoString: string;
	};
	needsApproval: boolean;
	owner: UserPreview;
	rudel: RudelPreview;
	relations: {
		isApplicant: boolean;
		isInvitee: boolean;
		isAttendee: boolean;
		isOwned: boolean;
	};
	statistics: {
		attendees: number;
		applicants: number;
		invitees: number;
	};
}

export interface ExpeditionLinks {
	icon: string;
}

export interface ExpeditionRecipe {
	title: string,
	description: string,
	needsApproval: boolean,
	fuzzyTime: boolean,
	date: string,
	icon: string,
	location: {
		lat: number,
		lng: number
	}
}


export interface ExpeditionAttendeeStatus {
	isApplicant: boolean,
	isInvitee: boolean,
	isAttendee: boolean
}

export interface ExpeditionRequestResponse {
	user: User,
	status: ExpeditionAttendeeStatus,
	expedition: Expedition
}
