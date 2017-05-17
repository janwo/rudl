import {Document} from "./document";
import {User} from "./user";
import {Rudel} from './rudel';

export interface Expedition extends Document {
	title: string;
	description?: string;
	location: {
		accuracy: number,
		latLng: number[]
	};
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
		isAwaiting: boolean;
		isApproved: boolean;
		isOwned: boolean;
	};
	statistics: {
		approvedUsers: number;
		awaitingUsers: number;
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
