import {Document} from "../Document";
import * as Joi from "joi";

export interface Event extends Document {
	title: string;
	description: string;
	needsApproval: boolean;
	date: string;
	fuzzyTime: boolean;
	location: Array<number>;
}

export const EventsValidation = {
	title: Joi.string().min(3),
	description: Joi.string().optional(),
	needsApproval: Joi.boolean().default(false),
	date: Joi.date().iso(),
	activity: Joi.string(),
	fuzzyTime: Joi.boolean().default(false),
	location: Joi.array().items(Joi.number())
};
