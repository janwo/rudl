import {Document} from "../Document";
import * as Joi from "joi";
import {Config} from "../../../../run/config";

export interface Expedition extends Document {
	title: string;
	description: string;
	needsApproval: boolean;
	date: string;
	fuzzyTime: boolean;
	location: Array<number>;
	icon: string
}

export const ExpeditionValidation = {
	title: Joi.string().min(5).max(50).required(),
	description: Joi.string().min(5).max(300).required(),
	needsApproval: Joi.boolean().default(false).required(),
	date: Joi.date().iso().required(),
	activity: Joi.string().required(),
	fuzzyTime: Joi.boolean().default(false).required(),
	location: Joi.array().ordered(Joi.number().min(-180).max(180).required(), Joi.number().min(-90).max(90).required()),
	icon: Joi.string().required().valid(Object.keys(Config.backend.icons))
};
