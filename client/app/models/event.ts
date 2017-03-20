import {Document} from "./document";
import {User} from "./user";

export interface Event extends Document {
	title: string;
	description?: string;
	location: number;
	accuracy: number;
	date: string;
	fuzzyDate: boolean;
	needsApproval: boolean;
	awaitingApproval: boolean;
	approved: boolean;
	totalSlots: number;
	freeSlots: number;
	owner: User;
	membersSample: User[];
}

export interface EventRecipe {
	title: string,
	description: string,
	needsApproval: boolean,
	fuzzyTime: boolean,
	slots: number,
	date: string,
	location: number[]
}
