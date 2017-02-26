import {Document} from "../Document";

export interface Event extends Document {
	title: string;
	description: string;
	needsApproval: boolean;
	slots: number;
	date: string;
	fuzzyDate: boolean;
	location: Array<number>;
}
