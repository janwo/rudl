import {Document} from "./document";
import {User} from "./user";

export interface Expedition extends Document {
	title: string;
	description?: string;
	location: number[];
	date: string;
	fuzzyTime: boolean;
	needsApproval: boolean;
	owner: User;
	links: ExpeditionLinks;
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
	activity: string,
	date: string,
	icon: string,
	location: number[]
}
