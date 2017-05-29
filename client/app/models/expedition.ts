import {Document} from "./document";
import {User} from "./user";
import {Rudel} from './rudel';
import {VagueLocation} from "./location";

export interface Expedition extends Document {
	title: string;
	description?: string;
	location: VagueLocation;
	date: {
		accuracy: number,
		isoString: string;
	};
	needsApproval: boolean;
	owner: User;
	links: ExpeditionLinks;
	rudel: Rudel;
	icon: string;
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

export interface InviteLikeItem {
	user: User,
	isApplicant: boolean,
	isInvitee: boolean,
	isAttendee: boolean
}
