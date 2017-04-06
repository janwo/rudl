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
	title: Joi.string().min(3).max(100),
	description: Joi.string().min(10).max(300),
	needsApproval: Joi.boolean().default(false),
	date: Joi.date().iso(),
	activity: Joi.string(),
	fuzzyTime: Joi.boolean().default(false),
	location: Joi.array().ordered(Joi.number().min(-180).max(180).required(), Joi.number().min(-90).max(90).required())
};
