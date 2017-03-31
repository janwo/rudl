import {Document} from "./document";
import {User} from "./user";

export interface Event extends Document {
	title: string;
	description?: string;
	location: number[];
	date: string;
	fuzzyTime: boolean;
	needsApproval: boolean;
	owner: User;
	links: EventLinks;
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

export interface EventLinks {
}

export interface EventRecipe {
	title: string,
	description: string,
	needsApproval: boolean,
	fuzzyTime: boolean,
	activity: string,
	date: string,
	location: number[]
}
